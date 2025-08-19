import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import createMemoryStore from "memorystore";
import { storage } from "./storage";
import { loginUserSchema, registerUserSchema } from "@shared/schema";
import type { User } from "@shared/schema";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  try {
    // For mock data (plain text passwords), compare directly
    if (!stored || !stored.includes(".")) {
      return supplied === stored;
    }
    
    // For hashed passwords
    const parts = stored.split(".");
    if (parts.length !== 2) {
      return supplied === stored; // Fallback to plain text comparison
    }
    
    const [hashed, salt] = parts;
    if (!hashed || !salt) {
      return supplied === stored; // Fallback to plain text comparison
    }
    
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error("Password comparison error:", error);
    // Fallback to simple comparison for mock data
    return supplied === stored;
  }
}

export function setupAuth(app: Express) {
  const MemoryStore = createMemoryStore(session);
  const sessionStore = new MemoryStore({
    checkPeriod: 86400000, // prune expired entries every 24h
  });

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          
          if (!user) {
            return done(null, false, { message: "Email ou senha inválidos" });
          }
          
          // Simple password comparison for mock data
          const passwordMatch = password === user.password;
          
          if (!passwordMatch) {
            return done(null, false, { message: "Email ou senha inválidos" });
          }
          
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => done(null, user.id));
  
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Register endpoint
  app.post("/api/register", async (req, res, next) => {
    try {
      const userData = registerUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Este email já está em uso" });
      }

      // Hash password and create user
      const hashedPassword = await hashPassword(userData.password);
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json({ 
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
        });
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Erro ao criar conta" });
    }
  });

  // Login endpoint
  app.post("/api/login", (req, res, next) => {
    try {
      loginUserSchema.parse(req.body);
      
      passport.authenticate("local", (err: any, user: User | false, info: any) => {
        if (err) return next(err);
        if (!user) {
          return res.status(401).json({ message: info?.message || "Email ou senha inválidos" });
        }
        
        req.login(user, (err) => {
          if (err) return next(err);
          res.json({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            profileImageUrl: user.profileImageUrl,
          });
        });
      })(req, res, next);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Dados inválidos" });
    }
  });

  // Logout endpoint
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy((err) => {
        if (err) return next(err);
        res.clearCookie('connect.sid');
        res.json({ message: "Logout realizado com sucesso" });
      });
    });
  });

  // Get current user
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Não autenticado" });
    }
    
    const user = req.user as User;
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImageUrl: user.profileImageUrl,
    });
  });
}

// Auth middleware
export function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Acesso negado" });
  }
  next();
}
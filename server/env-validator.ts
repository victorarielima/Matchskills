/**
 * Validador de Variáveis de Ambiente
 * Valida se todas as variáveis de ambiente necessárias estão configuradas antes de iniciar o servidor
 */

const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'SESSION_SECRET',
] as const;

const OPTIONAL_ENV_VARS = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'VITE_N8N_WEBHOOK_URL',
  'NODE_ENV',
  'PORT',
] as const;

interface ValidationResult {
  valid: boolean;
  missing: string[];
  warnings: string[];
}

export function validateEnvironment(): ValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Verifica variáveis obrigatórias
  for (const varName of REQUIRED_ENV_VARS) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  // Verifica variáveis opcionais mas recomendadas
  for (const varName of OPTIONAL_ENV_VARS) {
    if (!process.env[varName]) {
      warnings.push(`Variável opcional ${varName} não está configurada`);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

export function validateOrThrow(): void {
  const result = validateEnvironment();

  if (!result.valid) {
    console.error('❌ Variáveis de ambiente obrigatórias não configuradas:');
    result.missing.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\n📄 Por favor, verifique seu arquivo .env ou configuração de ambiente.');
    console.error('💡 Dica: Copie .env.example para .env e preencha suas credenciais.\n');
    throw new Error('Variáveis de ambiente obrigatórias não configuradas');
  }

  if (result.warnings.length > 0 && process.env.NODE_ENV !== 'production') {
    console.warn('⚠️  Variáveis de ambiente opcionais não configuradas:');
    result.warnings.forEach(warning => {
      console.warn(`   - ${warning}`);
    });
    console.warn('');
  }

  console.log('✅ Validação de ambiente concluída com sucesso');
}

import { supabase } from './lib/supabase';

export async function createTestUser() {
  // Cria um usuário falso no banco de dados (apenas para teste)
  const userId = crypto.randomUUID();
  
  // 1. Cria o perfil
  const { error: profileError } = await supabase
    .from('profiles')
    .insert([{ id: userId, role: 'operator' }]);

  if (profileError) {
    console.error("Erro ao criar perfil:", profileError);
    return;
  }

  console.log("Usuário de teste criado com ID:", userId);
  // Nota: Este usuário não terá login real, apenas serve para testar a tabela twins
}
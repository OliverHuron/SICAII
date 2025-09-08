const bcrypt = require('bcryptjs');

async function generatePassword() {
  const password = 'admin123';
  const saltRounds = 10;
  const hash = await bcrypt.hash(password, saltRounds);
  console.log('Password:', password);
  console.log('Hash:', hash);
  
  // Verificar que el hash funciona
  const isValid = await bcrypt.compare(password, hash);
  console.log('Verification:', isValid);
}

generatePassword().catch(console.error);

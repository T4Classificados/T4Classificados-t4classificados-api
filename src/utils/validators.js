exports.validateURL = (url) => {
  try {
    new URL(url.startsWith('http') ? url : `https://${url}`);
    return true;
  } catch {
    return false;
  }
};

exports.validatePhoneNumber = (phone) => {
  // Remove todos os caracteres não numéricos
  const numbers = phone.replace(/\D/g, '');
  
  // Verifica se tem entre 10 e 11 dígitos (com DDD)
  // Ou 12 e 13 dígitos (com código do país)
  return /^(\d{10,11}|\d{12,13})$/.test(numbers);
}; 
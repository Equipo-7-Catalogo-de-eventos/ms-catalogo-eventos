const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Faltan credenciales de Supabase en el .env');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
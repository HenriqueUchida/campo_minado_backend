import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const port = process.env.PORT || 3000; 

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});


app.get('/partida', async (req, res) => {
  try {
    const [rows] = await pool.query(`
       select date_format(p.data_partida, '%d/%m/%y') as data_partida,
	          p.nome_jogador,
              max(p.pontuacao) as pontuacao
        from partida p
        group by date_format(p.data_partida, '%d/%m/%y'),
            p.nome_jogador
        ORDER BY max(p.pontuacao) desc
        LIMIT 10
    `);
    res.json(rows);
  } catch (error) {
    console.error('Erro ao conectar com o banco:', error);
    res.status(500).json({ erro: 'Falha ao conectar no banco de dados', detalhes: error.message });
  }
});

app.post('/partida', async (req, res) => {
  try {
    const { nome_jogador, pontuacao } = req.body;

    // 2. Validação simples: verifica se os dados realmente foram enviados
    if (!nome_jogador || pontuacao === undefined) {
      return res.status(400).json({ erro: 'Nome do jogador e pontuação são obrigatórios!' });
    }

    const querySQL = 'INSERT INTO partida (nome_jogador, pontuacao) VALUES (?, ?)';
    
    const [resultado] = await pool.query(querySQL, [nome_jogador, pontuacao]);

    res.status(201).json({ 
      mensagem: 'Partida salva com sucesso!',
      id_inserido: resultado.insertId 
    });

  } catch (error) {
    console.error('Erro ao salvar partida:', error);
    res.status(500).json({ erro: 'Falha ao salvar a partida no banco de dados' });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
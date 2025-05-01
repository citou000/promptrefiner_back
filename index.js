import cors from 'cors'
import dotenv from 'dotenv'
import axios from 'axios'
import express from 'express'

dotenv.config()
const app = express()
app.use(cors())
app.use(express.json())

// Vérifie que la clé API Groq est définie
if (!process.env.GROQ_API_KEY) {
  console.error('Groq API key is missing.')
  process.exit(1) // Arrête le serveur si la clé API est manquante
}

app.post('/generate', async (req, res) => {
  const { prompt } = req.body

  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ error: 'Prompt is required' })
  }

  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama3-8b-8192',

        messages: [
          {
            role: 'system',
            content: `You are a prompt generator. Your task is to create a single, self-contained, optimized, effective prompt to be used as input for an AI assistant,that will push the AI to return interesting, diverse, or challenging ideas.

            The prompt should:
            - Be a clear and complete instruction.
            - Include all context provided by the user.
            - Never ask follow-up questions or request clarifications.
            - Assume the AI that receives the prompt will handle ambiguities or ask questions later.
            - Return only the final prompt, no explanations or lists or quoted or introduction.
            - Don't put it in quote
    `,
          },
          {
            role: 'user',
            content: `Generate a prompt to achieve this ${prompt}`
          }
        ]
        ,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const output = response.data.choices?.[0]?.message?.content

    if (!output) {
      return res.status(500).json({ error: 'No valid response from Groq API.' })
    }

    res.json({ generatedPrompt: output })
  } catch (error) {
    console.error('Groq API error:', error.response?.data || error.message)
    res.status(500).json({ error: 'Failed to get response from Groq API.' })
  }
})
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})

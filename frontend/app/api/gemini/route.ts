import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // TODO: Replace with your actual Gemini API key and endpoint
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY
    const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'

    if (!GEMINI_API_KEY) {
      console.error('Gemini API key not found')
      return NextResponse.json(
        { error: 'API configuration error' },
        { status: 500 }
      )
    }

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You are a helpful AI assistant. Please respond to the following user message in a helpful, friendly, and concise manner: ${message}`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    })

    if (!response.ok) {
      throw new Error(`Gemini API responded with status: ${response.status}`)
    }

    const data = await response.json()
    
    // Extract the response text from Gemini API response
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 
                      'I apologize, but I couldn\'t generate a response at this time.'

    return NextResponse.json({ response: aiResponse })

  } catch (error) {
    console.error('Error calling Gemini API:', error)
    return NextResponse.json(
      { error: 'Failed to get AI response' },
      { status: 500 }
    )
  }
}

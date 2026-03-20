import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const transcriptText = body.transcriptText;

    if (!transcriptText) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `You are an expert US university academic advisor. Analyze the following degree audit and/or transcript carefully.

Return your analysis in this exact JSON format, no other text:
{
  "summary": {
    "creditsCompleted": <number>,
    "creditsRequired": <number>,
    "missingRequirementsCount": <number>,
    "atRiskCount": <number>
  },
  "missingCourses": [
    {
      "code": "<course code>",
      "name": "<course name>",
      "type": "required",
      "urgent": true
    }
  ],
  "risks": [
    {
      "description": "<risk description>",
      "severity": "high"
    }
  ],
  "freeInsight": "<2-3 sentence plain English summary>"
}

Student's degree audit / transcript:
${transcriptText}`,
        },
      ],
    });

    const result = message.content[0];
    if (result.type !== 'text') {
      return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
    }

    try {
      const cleaned = result.text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      const analysis = JSON.parse(cleaned);
      return NextResponse.json({ analysis });
    } catch {
      return NextResponse.json({ rawAnalysis: result.text });
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

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
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `You are an expert US university academic advisor with 20 years of experience. Analyze the following degree audit and/or transcript carefully and thoroughly.

Return your analysis in this EXACT JSON format, no other text, no markdown:

{
  "summary": {
    "creditsCompleted": <number>,
    "creditsRequired": <number>,
    "missingRequirementsCount": <number>,
    "atRiskCount": <number>,
    "gpaStressScore": <number 1-10>,
    "graduationStressScore": <number 1-10>,
    "estimatedSemestersRemaining": <number>,
    "optimizedSemestersRemaining": <number>,
    "gpaAnalysis": "<1-2 sentences on GPA stability and risk>"
  },
  "missingCourses": [
    {
      "code": "<course code>",
      "name": "<course name>",
      "type": "<required|elective|GE>",
      "urgent": <true|false>,
      "priority": <1-5>,
      "reason": "<why urgent>"
    }
  ],
  "graduationBlockers": [
    {
      "description": "<specific blocker>",
      "severity": "<critical|high>",
      "action": "<exact action student must take now>"
    }
  ],
  "prerequisiteAlerts": [
    {
      "missingCourse": "<course student needs>",
      "prerequisite": "<course they must take first>",
      "consequence": "<what happens if they don't take prerequisite this semester>"
    }
  ],
  "risks": [
    {
      "description": "<risk description>",
      "severity": "<high|medium>"
    }
  ],
  "nextSemesterPlan": {
    "recommendedCourses": [
      {
        "code": "<course code>",
        "name": "<course name>",
        "reason": "<why take next semester>",
        "priority": "<must-take|highly-recommended>"
      }
    ],
    "perfectSemester": "<2-3 sentences on ideal next semester combination>"
  },
  "courseOrderSuggestion": [
    {
      "semester": "<e.g. Fall 2026>",
      "courses": ["<course code> — <course name>"],
      "focus": "<theme of this semester>"
    }
  ],
  "timeline": {
    "currentPath": "<e.g. May 2027 — 4 semesters remaining>",
    "optimizedPath": "<e.g. December 2026 — 3 semesters if following recommendations>",
    "timeSaved": "<e.g. 1 semester (approximately 5 months)>"
  },
  "advisorScript": {
    "emailSubject": "<suggested email subject line>",
    "emailBody": "<ready-to-send 150-200 word professional email the student can copy-paste to their academic advisor>"
  },
  "freeInsight": "<2-3 sentence plain English summary>",
  "fullInsight": "<5-7 sentence comprehensive summary covering current status, biggest risks, recommended actions, and graduation outlook>"
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

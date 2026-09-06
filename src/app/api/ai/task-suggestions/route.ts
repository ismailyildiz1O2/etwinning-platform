import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface TaskSuggestionRequest {
  taskTitle: string;
  taskDescription?: string;
  phaseTitle?: string;
  projectName?: string;
}

interface Suggestion {
  id: string;
  text: string;
  type: "tip" | "resource" | "activity" | "tool";
  icon: string;
}

function generateId(): string {
  return `sug_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

function generateFallbackSuggestions(input: TaskSuggestionRequest): Suggestion[] {
  const title = (input.taskTitle || "").toLowerCase();
  const description = (input.taskDescription || "").toLowerCase();
  const combined = `${title} ${description}`;

  // --- research ---
  if (combined.includes("araştırma") || combined.includes("arastirma") || combined.includes("research")) {
    return [
      { id: generateId(), text: "Give students a short training session on using reliable sources. Encourage them to prefer academic sources and official institutional websites over Wikipedia.", type: "tip", icon: "🔍" },
      { id: generateId(), text: "Create a shared Padlet or Google Jamboard board to share research findings. Let each school fill in its own section.", type: "tool", icon: "📌" },
      { id: generateId(), text: "Prepare a 'Research Journal' template so students can document their research process: source, date, and what they learned.", type: "resource", icon: "📓" },
      { id: generateId(), text: "Plan a 'Mini Conference' event where each school shares its research results in short 3-minute video presentations.", type: "activity", icon: "🎤" },
      { id: generateId(), text: "Split the research topics into sub-topics and assign a different sub-topic to each partner school. This avoids repetition and produces more in-depth content.", type: "tip", icon: "💡" },
    ];
  }

  // --- icebreaker ---
  if (combined.includes("tanışma") || combined.includes("tanisma") || combined.includes("icebreaker") || combined.includes("kendini tanıt") || combined.includes("introduce") || combined.includes("introduction") || combined.includes("getting to know")) {
    return [
      { id: generateId(), text: "Have each student record a 60-second video introducing themselves. Share the videos on Flipgrid or in the TwinSpace.", type: "activity", icon: "🎬" },
      { id: generateId(), text: "Organize a shared 'Guess Who?' game: each student shares 3 interesting facts, and the others guess who they belong to.", type: "activity", icon: "🎲" },
      { id: generateId(), text: "Create digital 'About Me' cards with Canva or Book Creator. Include details such as name, hobbies, favorite food, and dream job.", type: "tool", icon: "🎨" },
      { id: generateId(), text: "For the first icebreaker meeting, set up small groups (breakout rooms) in Zoom/Teams. Groups of 4-5 make communication more comfortable.", type: "tip", icon: "💬" },
      { id: generateId(), text: "Create a shared class map: mark each school's location on Google My Maps and add short introduction notes.", type: "resource", icon: "🗺️" },
    ];
  }

  // --- meeting ---
  if (combined.includes("toplantı") || combined.includes("toplanti") || combined.includes("meeting") || combined.includes("görüşme") || combined.includes("videoconference") || combined.includes("video conference") || combined.includes("webinar")) {
    return [
      { id: generateId(), text: "Share a common agenda document before the meeting. Let each partner school add its own agenda items.", type: "tip", icon: "📋" },
      { id: generateId(), text: "If you work with partners in different time zones, use World Time Buddy to find a meeting time that suits everyone.", type: "tool", icon: "🕐" },
      { id: generateId(), text: "Use Otter.ai or the transcript feature in Microsoft Teams to take meeting notes automatically.", type: "tool", icon: "📝" },
      { id: generateId(), text: "At the end of each meeting, create an 'Action Plan' that clarifies the next steps and who is responsible for them.", type: "tip", icon: "✅" },
      { id: generateId(), text: "To keep students actively involved during the meeting, add interactive polls and Q&A sessions with Mentimeter or Slido.", type: "activity", icon: "📊" },
    ];
  }

  // --- survey / evaluation ---
  if (combined.includes("anket") || combined.includes("değerlendirme") || combined.includes("degerlendirme") || combined.includes("survey") || combined.includes("form") || combined.includes("evaluation") || combined.includes("assessment") || combined.includes("questionnaire") || combined.includes("feedback")) {
    return [
      { id: generateId(), text: "Create multilingual surveys with Google Forms or Microsoft Forms. Write each question in more than one language so all partners can understand it.", type: "tool", icon: "📊" },
      { id: generateId(), text: "Use Canva Infographic or Google Data Studio to visualize the survey results. This makes the data much easier to understand.", type: "tool", icon: "📈" },
      { id: generateId(), text: "Have students use a 'KWL Chart' (Know - Want to know - Learned) to evaluate the project process.", type: "resource", icon: "📋" },
      { id: generateId(), text: "Add a mid-project evaluation survey with open-ended questions such as 'What did you learn most in this phase?', 'What challenges did you face?', and 'What would you suggest?'.", type: "tip", icon: "💡" },
      { id: generateId(), text: "Create a rubric for peer assessment. Let students evaluate each other's work with constructive feedback.", type: "activity", icon: "🤝" },
    ];
  }

  // --- photo / video (media) ---
  if (combined.includes("fotoğraf") || combined.includes("fotograf") || combined.includes("video") || combined.includes("film") || combined.includes("medya") || combined.includes("photo") || combined.includes("media") || combined.includes("picture")) {
    return [
      { id: generateId(), text: "Teach students basic composition tips for taking photos, such as the 'rule of thirds' and good lighting.", type: "tip", icon: "📷" },
      { id: generateId(), text: "Use free, student-friendly tools such as CapCut, iMovie, or Clipchamp for video editing.", type: "tool", icon: "🎬" },
      { id: generateId(), text: "Prepare photo/video consent forms in advance and obtain parental approval to stay compliant with GDPR and local data protection laws.", type: "tip", icon: "🔒" },
      { id: generateId(), text: "Organize a joint photo contest: each school selects its 5 best photos that fit the project theme, then everyone votes.", type: "activity", icon: "🏆" },
      { id: generateId(), text: "Create a shared folder structure in Google Drive or OneDrive (country/date/activity) to keep photos and videos well organized.", type: "resource", icon: "📁" },
    ];
  }

  // --- ebook ---
  if (combined.includes("e-kitap") || combined.includes("kitap") || combined.includes("ebook") || combined.includes("book creator") || combined.includes("e-book")) {
    return [
      { id: generateId(), text: "Create interactive e-books using Book Creator, StoryJumper, or Ourboox. You can add audio, video, and animations.", type: "tool", icon: "📚" },
      { id: generateId(), text: "Assign one chapter of the e-book to each partner school. In the end, combine all chapters into a joint international publication.", type: "tip", icon: "✍️" },
      { id: generateId(), text: "Add QR codes to the e-book: the QR code on each page can link to extra videos, audio recordings, or interactive content.", type: "resource", icon: "📱" },
      { id: generateId(), text: "Run a design contest for the e-book cover. Let all partners vote.", type: "activity", icon: "🎨" },
      { id: generateId(), text: "Publish the finished e-book on Issuu or Calaméo to reach a wider audience and increase the visibility of the project.", type: "tip", icon: "🌐" },
    ];
  }

  // --- exhibition / presentation ---
  if (combined.includes("sergi") || combined.includes("sunum") || combined.includes("presentation") || combined.includes("infografik") || combined.includes("exhibition") || combined.includes("infographic") || combined.includes("showcase")) {
    return [
      { id: generateId(), text: "For a virtual exhibition, create a 3D virtual gallery using platforms such as Artsteps or Kunstmatrix.", type: "tool", icon: "🏛️" },
      { id: generateId(), text: "Prepare interactive presentations with Canva, Genially, or Prezi. Prefer clickable, animated content over static slides.", type: "tool", icon: "🖥️" },
      { id: generateId(), text: "Prepare digital invitations for parents and school management for the exhibition/presentation day. This increases the visibility of the project.", type: "tip", icon: "✉️" },
      { id: generateId(), text: "Record short teaser videos representing each school's exhibition corner and share them on social media before the presentation.", type: "activity", icon: "📢" },
      { id: generateId(), text: "Use Piktochart or Venngage to create infographics. Summarize project data and learning outcomes visually.", type: "resource", icon: "📊" },
    ];
  }

  // --- logo / poster / design ---
  if (combined.includes("logo") || combined.includes("afiş") || combined.includes("afis") || combined.includes("tasarım") || combined.includes("tasarim") || combined.includes("design") || combined.includes("poster") || combined.includes("banner")) {
    return [
      { id: generateId(), text: "Use free tools such as Canva, Adobe Express, or LogoMakr for logo design. Explain basic design principles (color harmony, simplicity) to students.", type: "tool", icon: "🎨" },
      { id: generateId(), text: "Collect logo/poster proposals from each school and hold a democratic vote in which all partners take part.", type: "activity", icon: "🗳️" },
      { id: generateId(), text: "Make sure the designs use symbols that reflect the project theme, the spirit of partnership, and cultural diversity.", type: "tip", icon: "💡" },
      { id: generateId(), text: "Keep a 'Design Journal' to document the design process: first sketches, feedback, revisions, and the final version.", type: "resource", icon: "📓" },
      { id: generateId(), text: "Use a consistent color palette and font across all designs. Creating a brand kit gives the project a professional look.", type: "tip", icon: "🖌️" },
    ];
  }

  // --- digital safety / e-safety ---
  if (combined.includes("güvenlik") || combined.includes("guvenlik") || combined.includes("e-güvenlik") || combined.includes("safety") || combined.includes("gizlilik") || combined.includes("privacy") || combined.includes("e-safety") || combined.includes("esafety") || combined.includes("security") || combined.includes("cyberbullying")) {
    return [
      { id: generateId(), text: "Use Common Sense Education's digital citizenship curriculum to teach students online safety rules.", type: "resource", icon: "🛡️" },
      { id: generateId(), text: "Set clear rules about sharing personal information: details such as home addresses and phone numbers must never be shared.", type: "tip", icon: "🔒" },
      { id: generateId(), text: "Organize a cyberbullying awareness poster activity. Each school prepares posters in its own language and shares them.", type: "activity", icon: "🚫" },
      { id: generateId(), text: "Prepare an interactive quiz on creating strong passwords, two-factor authentication, and safe internet use.", type: "activity", icon: "🔐" },
      { id: generateId(), text: "Inform students about copyright and Creative Commons licenses. Have them check the license status of every image used in the project.", type: "tip", icon: "©️" },
    ];
  }

  // --- quality label ---
  if (combined.includes("kalite etiketi") || combined.includes("quality label") || combined.includes("kalite")) {
    return [
      { id: generateId(), text: "In the Quality Label application, document the project process chronologically: clearly show the planning, implementation, evaluation, and dissemination phases.", type: "tip", icon: "🏅" },
      { id: generateId(), text: "Keep the TwinSpace well organized: arrange pages by phase and systematically upload student work and evidence of collaboration.", type: "tip", icon: "📂" },
      { id: generateId(), text: "Be sure to include student and teacher evaluation surveys. Assessment tools that allow a before-and-after comparison provide strong evidence.", type: "resource", icon: "📊" },
      { id: generateId(), text: "Create dissemination evidence by sharing project outputs in local and national media, on the school website, and on social media.", type: "activity", icon: "📰" },
      { id: generateId(), text: "Document curriculum integration: prepare a table showing which subjects and learning outcomes the project is linked to.", type: "resource", icon: "📚" },
    ];
  }

  // --- twinspace ---
  if (combined.includes("twinspace") || combined.includes("twin space")) {
    return [
      { id: generateId(), text: "Create separate pages in the TwinSpace for each project phase. A clear navigation structure helps both students and evaluators.", type: "tip", icon: "📑" },
      { id: generateId(), text: "Make active use of the TwinSpace forums: set a discussion topic every week to increase interaction between students.", type: "activity", icon: "💬" },
      { id: generateId(), text: "Add students to the TwinSpace as administrators so they can upload their own content and edit pages.", type: "tip", icon: "👥" },
      { id: generateId(), text: "Upload collaboration templates, rubrics, and planning documents to the 'Materials' section of the TwinSpace.", type: "resource", icon: "📎" },
      { id: generateId(), text: "Use the TwinSpace journal/blog feature to record the project process on a regular basis.", type: "resource", icon: "📝" },
    ];
  }

  // --- map / geography ---
  if (combined.includes("harita") || combined.includes("map") || combined.includes("coğrafya") || combined.includes("cografya") || combined.includes("geography")) {
    return [
      { id: generateId(), text: "Create an interactive project map with Google My Maps. When someone clicks a partner school's location, show the school introduction and student work.", type: "tool", icon: "🗺️" },
      { id: generateId(), text: "Use StoryMapJS to tell your project story on a map. Each location can represent a project phase or an activity.", type: "tool", icon: "📍" },
      { id: generateId(), text: "Have students photograph important places in their own region and add them to the map: cultural heritage, natural beauty, etc.", type: "activity", icon: "📸" },
      { id: generateId(), text: "Display comparative data on the map: visualize data such as climate, population, and traditions to build intercultural awareness.", type: "resource", icon: "📊" },
      { id: generateId(), text: "Embed the finished digital map on the project website or in the TwinSpace to share it interactively.", type: "tip", icon: "🌐" },
    ];
  }

  // --- Default: general project management tips ---
  return [
    { id: generateId(), text: "Set a clear timeline and milestones for this task. Small, measurable goals increase motivation.", type: "tip", icon: "📅" },
    { id: generateId(), text: "Create a checklist in the TwinSpace to track progress on this task.", type: "resource", icon: "✅" },
    { id: generateId(), text: "Make sure at least one student from every partner school takes an active part in this task. Sharing responsibility strengthens collaboration.", type: "tip", icon: "🤝" },
    { id: generateId(), text: "When the task is complete, hold a short reflection activity: discuss the questions 'What went well?' and 'What could we improve?'.", type: "activity", icon: "🪞" },
    { id: generateId(), text: "Take screenshots, photos, and short notes to document the task. These materials will be very valuable for the Quality Label application.", type: "tip", icon: "📸" },
  ];
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: TaskSuggestionRequest = await request.json();

    if (!body.taskTitle) {
      return NextResponse.json(
        { error: "taskTitle is required" },
        { status: 400 }
      );
    }

    // If we have an API key, use Gemini for AI suggestions
    const { generateJsonWithGemini, isGeminiConfigured } = await import("@/lib/ai");
    if (isGeminiConfigured()) {
      try {
        const { web2Tools } = await import("@/lib/web2-tools");
        const toolNames = web2Tools.map(t => t.name).join(", ");

        const systemPrompt = `You are an eTwinning project assistant. You provide teachers with practical, actionable suggestions for each project task.
The following Web 2.0 tools are available on our platform: ${toolNames}.
When suggesting activities and tools, give PRIORITY to the tools in this list.
You return your answer ONLY as valid JSON and write nothing else.
Every suggestion text MUST be written in English, regardless of the language of the task title or description, because the content is shared with international partner schools.`;

        const userPrompt = `Generate at most 5 suggestions for the eTwinning project task below.

Task: ${body.taskTitle}
${body.taskDescription ? `Description: ${body.taskDescription}` : ""}
${body.phaseTitle ? `Phase: ${body.phaseTitle}` : ""}
${body.projectName ? `Project: ${body.projectName}` : ""}

Each suggestion must have the following format:
- text: A detailed, actionable suggestion text written in English. (If you suggest a tool, prefer one from the list above and mention its name in the text.)
- type: "tip" | "resource" | "activity" | "tool" (the kind of suggestion)
- icon: A suitable emoji

Rules:
1. Generate at most 5 suggestions
2. Suggestions must be concrete and actionable
3. Suggestions must be meaningful in the context of eTwinning projects
4. Provide a mix of types (not only "tip" but also "tool", "activity", and "resource")
5. For "tool" or "activity" suggestions, prioritize the applications from the tool list you were given
6. Write every suggestion text in English, even if the task title or description is in another language

JSON format:
{
  "suggestions": [
    { "text": "Suggestion text", "type": "tip", "icon": "💡" }
  ]
}`;

        const parsed = await generateJsonWithGemini<{
          suggestions?: { text: string; type: string; icon: string }[];
        }>(userPrompt, systemPrompt);

        if (parsed) {
          const suggestions: Suggestion[] = (parsed.suggestions || [])
            .slice(0, 5)
            .map((s: { text: string; type: string; icon: string }) => ({
              id: generateId(),
              text: s.text,
              type: s.type as Suggestion["type"],
              icon: s.icon || "💡",
            }));

          return NextResponse.json({
            suggestions,
            source: "ai",
          });
        }
        // If AI fails or returns invalid JSON, fall through to fallback
      } catch (aiError) {
        console.error("AI suggestion generation failed, using fallback:", aiError);
      }
    }

    // Fallback: generate suggestions using keyword matching
    const suggestions = generateFallbackSuggestions(body);
    return NextResponse.json({
      suggestions,
      source: "fallback",
    });
  } catch (error) {
    console.error("Error generating task suggestions:", error);
    return NextResponse.json(
      { error: "An error occurred while generating suggestions" },
      { status: 500 }
    );
  }
}

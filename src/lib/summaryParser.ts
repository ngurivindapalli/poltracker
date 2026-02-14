/**
 * Parse and structure AI-generated bill summary
 * Removes markdown artifacts and organizes into sections
 */

export type SummarySection = {
  title: string
  content: string[]
}

/**
 * Remove markdown formatting from text
 */
function removeMarkdown(text: string): string {
  return text
    .replace(/\*\*/g, '') // Remove bold markers
    .replace(/\*/g, '') // Remove italic markers
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Remove links, keep text
    .replace(/#{1,6}\s+/g, '') // Remove heading markers
    .trim()
}

/**
 * Detect section headers in the summary text
 */
function detectSectionTitle(line: string): string | null {
  const cleaned = removeMarkdown(line.trim())
  
  // Must be a short line (likely a header) and match a pattern
  if (cleaned.length > 100) return null
  
  // Common section patterns (with or without colon)
  const normalized = cleaned.toLowerCase().replace(/[:•-]/g, '').trim()
  
  if (/^(bill summary|summary)$/i.test(normalized)) return 'Bill Summary'
  if (/^(what the bill does|what this bill does|bill purpose|purpose)$/i.test(normalized)) return 'What the Bill Does'
  if (/^(who it affects|who this affects|affected parties|target audience|who is affected)$/i.test(normalized)) return 'Who It Affects'
  if (/^(major provisions|key provisions|provisions|main provisions|key points)$/i.test(normalized)) return 'Major Provisions'
  if (/^(potential impacts|impacts|effects|consequences|expected impacts)$/i.test(normalized)) return 'Potential Impacts'
  
  return null
}

/**
 * Parse summary text into structured sections
 */
export function parseSummary(summary: string): SummarySection[] {
  const lines = summary.split('\n').map(line => line.trim()).filter(line => line.length > 0)
  const sections: SummarySection[] = []
  let currentSection: SummarySection | null = null
  
  for (const line of lines) {
    const sectionTitle = detectSectionTitle(line)
    
    if (sectionTitle) {
      // Save previous section if exists
      if (currentSection && currentSection.content.length > 0) {
        sections.push(currentSection)
      }
      // Start new section
      currentSection = {
        title: sectionTitle,
        content: []
      }
    } else {
      // Initialize first section if needed
      if (!currentSection) {
        currentSection = {
          title: 'Bill Summary',
          content: []
        }
      }
      
      // Add content to current section
      const cleaned = removeMarkdown(line)
      if (cleaned.length > 0) {
        currentSection.content.push(cleaned)
      }
    }
  }
  
  // Add final section
  if (currentSection && currentSection.content.length > 0) {
    sections.push(currentSection)
  }
  
  // If no sections were found, create one with all content
  if (sections.length === 0) {
    const allContent = lines.map(removeMarkdown).filter(line => line.length > 0)
    if (allContent.length > 0) {
      sections.push({
        title: 'Bill Summary',
        content: allContent
      })
    }
  }
  
  return sections
}

/**
 * Split content into paragraphs and bullet points
 */
export function formatContent(content: string[]): { type: 'paragraph' | 'list'; items: string[] }[] {
  const result: { type: 'paragraph' | 'list'; items: string[] }[] = []
  let currentParagraph: string[] = []
  let currentList: string[] = []
  
  for (const line of content) {
    // Detect bullet points (starts with -, •, or numbered)
    const isBullet = /^[-•*]\s+/.test(line) || /^\d+\.\s+/.test(line)
    const cleanedLine = line.replace(/^[-•*]\s+/, '').replace(/^\d+\.\s+/, '').trim()
    
    if (isBullet && cleanedLine.length > 0) {
      // If we have a paragraph in progress, save it
      if (currentParagraph.length > 0) {
        result.push({ type: 'paragraph', items: currentParagraph })
        currentParagraph = []
      }
      // Add to list
      currentList.push(cleanedLine)
    } else if (cleanedLine.length > 0) {
      // If we have a list in progress, save it
      if (currentList.length > 0) {
        result.push({ type: 'list', items: currentList })
        currentList = []
      }
      // Add to paragraph
      currentParagraph.push(cleanedLine)
    }
  }
  
  // Save any remaining content
  if (currentParagraph.length > 0) {
    result.push({ type: 'paragraph', items: currentParagraph })
  }
  if (currentList.length > 0) {
    result.push({ type: 'list', items: currentList })
  }
  
  return result
}

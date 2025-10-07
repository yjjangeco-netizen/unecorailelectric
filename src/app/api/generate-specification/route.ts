import { NextRequest, NextResponse } from 'next/server'

interface SpecificationData {
  type: 'PVR' | '전기판넬 및 제작' | '시운전'
  title: string
  projectName: string
  projectNumber: string
  client: string
  location: string
  date: string
  specifications: {
    section: string
    content: string
  }[]
  notes: string
  format: 'hwp' | 'doc'
}

export async function POST(request: NextRequest) {
  try {
    const data: SpecificationData = await request.json()
    
    // 사양서 템플릿 생성
    const specificationContent = generateSpecificationContent(data)
    
    // 파일 생성
    let fileName: string
    let mimeType: string
    let fileContent: string

    if (data.format === 'hwp') {
      // HWP 파일 생성 (실제로는 HTML을 HWP로 변환하는 라이브러리 필요)
      fileName = `${data.title}.hwp`
      mimeType = 'application/hwp'
      fileContent = generateHWPContent(specificationContent)
    } else {
      // DOC 파일 생성 (실제로는 HTML을 DOC로 변환하는 라이브러리 필요)
      fileName = `${data.title}.doc`
      mimeType = 'application/msword'
      fileContent = generateDOCContent(specificationContent)
    }

    // 파일 다운로드 응답
    return new NextResponse(fileContent, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
      },
    })
  } catch (error) {
    console.error('사양서 생성 오류:', error)
    return NextResponse.json({ error: '사양서 생성 실패' }, { status: 500 })
  }
}

function generateSpecificationContent(data: SpecificationData): string {
  const { type, title, projectName, projectNumber, client, location, date, specifications, notes } = data
  
  let content = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        body { font-family: '맑은 고딕', Arial, sans-serif; margin: 40px; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 40px; }
        .title { font-size: 24px; font-weight: bold; margin-bottom: 20px; }
        .project-info { font-size: 14px; color: #666; }
        .section { margin-bottom: 30px; }
        .section-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; border-bottom: 2px solid #333; padding-bottom: 5px; }
        .section-content { font-size: 14px; white-space: pre-wrap; }
        .notes { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc; }
        .footer { margin-top: 40px; text-align: right; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">${title}</div>
        <div class="project-info">
          <p>프로젝트명: ${projectName}</p>
          <p>프로젝트 번호: ${projectNumber}</p>
          <p>발주처: ${client}</p>
          <p>현장 위치: ${location}</p>
          <p>작성일: ${date}</p>
        </div>
      </div>

      <div class="content">
        ${specifications.map(spec => `
          <div class="section">
            <div class="section-title">${spec.section}</div>
            <div class="section-content">${spec.content}</div>
          </div>
        `).join('')}
      </div>

      ${notes ? `
        <div class="notes">
          <div class="section-title">비고</div>
          <div class="section-content">${notes}</div>
        </div>
      ` : ''}

      <div class="footer">
        <p>${type} 사양서 - ${projectName}</p>
        <p>작성일: ${date}</p>
      </div>
    </body>
    </html>
  `
  
  return content
}

function generateHWPContent(htmlContent: string): string {
  // 실제 구현에서는 HTML을 HWP 형식으로 변환하는 라이브러리 사용
  // 여기서는 간단히 HTML을 반환 (실제로는 hwp.js 같은 라이브러리 사용)
  return htmlContent
}

function generateDOCContent(htmlContent: string): string {
  // 실제 구현에서는 HTML을 DOC 형식으로 변환하는 라이브러리 사용
  // 여기서는 간단히 HTML을 반환 (실제로는 html-docx-js 같은 라이브러리 사용)
  return htmlContent
}

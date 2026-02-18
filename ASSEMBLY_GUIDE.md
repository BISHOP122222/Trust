# TRUST POS RESEARCH PROPOSAL - ASSEMBLY GUIDE

## Overview

You now have a complete research proposal divided into 7 parts. This guide will help you assemble them into a single 15-20 page PDF document.

---

## Files Created

| **File Name** | **Content** | **Approx. Pages** |
|---------------|-------------|-------------------|
| `research_proposal_part1_title_intro_background.md` | Title page, Introduction, Background, Literature Review | 3-4 pages |
| `research_proposal_part2_methodology.md` | Research Questions, Aims, Objectives, Study Design, Sampling | 2-3 pages |
| `research_proposal_part3_data_collection.md` | Data Collection Methods & Instruments | 2-3 pages |
| `research_proposal_part4_data_analysis.md` | Quantitative & Qualitative Analysis Plans | 2-3 pages |
| `research_proposal_part5_quality_timeline.md` | Quality Assurance, Timeline, Participants | 3-4 pages |
| `research_proposal_part6_ethics_budget.md` | Ethical Considerations, Resources, Budget | 2-3 pages |
| `research_proposal_part7_references_appendices.md` | References, Appendices, Consent Forms, Instruments | 3-4 pages |

**Total:** Approximately 17-24 pages (before formatting adjustments)

---

## Assembly Instructions

### Method 1: Using Microsoft Word (Recommended)

1. **Create a New Word Document**
   - Open Microsoft Word
   - Set up formatting:
     - Font: Times New Roman 12pt
     - Line spacing: 1.5
     - Margins: 1 inch (2.54 cm) all sides
     - Page numbers: Bottom center

2. **Copy and Paste Each Part in Order**
   - Open each markdown file
   - Copy all content
   - Paste into Word document
   - Remove markdown symbols (##, ###, **bold**, etc.) and apply Word styles
   - Apply heading styles:
     - Main sections (##) → Heading 1
     - Subsections (###) → Heading 2
     - Sub-subsections (####) → Heading 3

3. **Format Tables**
   - Convert markdown tables to Word tables
   - Apply table styles for consistency

4. **Add Page Breaks**
   - Insert page breaks between major sections

5. **Insert Page Numbers**
   - Insert > Page Numbers
   - Format: Bottom center or top right

6. **Create Table of Contents** (Optional but recommended)
   - Insert blank page after title page
   - References > Table of Contents > Automatic

7. **Final Adjustments**
   - Check page count (should be 15-20 pages for main body)
   - If too long: reduce spacing, use single spacing for tables, remove some examples
   - If too short: expand literature review, add more detail to methods

8. **Proofread**
   - Check for formatting consistency
   - Verify all [placeholders] are replaced with your actual information
   - Spell check

9. **Save and Export**
   - Save as .docx
   - Export/Save As PDF: `TRUST_POS_Research_Proposal.pdf`

---

### Method 2: Using Markdown to PDF Converter

**Using Pandoc (Free, powerful):**

1. **Install Pandoc**
   - Download from: https://pandoc.org/installing.html

2. **Combine All Files**
   - Open PowerShell/Command Prompt
   - Navigate to your TRUST folder:
     ```
     cd "c:\Users\DELL\Desktop\dont touch\TRUST"
     ```

3. **Merge Files**
   - Create a combined file:
     ```powershell
     Get-Content research_proposal_part1_title_intro_background.md, `
                 research_proposal_part2_methodology.md, `
                 research_proposal_part3_data_collection.md, `
                 research_proposal_part4_data_analysis.md, `
                 research_proposal_part5_quality_timeline.md, `
                 research_proposal_part6_ethics_budget.md, `
                 research_proposal_part7_references_appendices.md `
                 | Set-Content research_proposal_complete.md
     ```

4. **Convert to PDF**
   ```
   pandoc research_proposal_complete.md -o TRUST_POS_Research_Proposal.pdf --pdf-engine=xelatex -V geometry:margin=1in -V fontsize=12pt -V linestretch=1.5
   ```

5. **Review and Adjust**
   - Open the PDF
   - Check formatting
   - Make adjustments in the .md file if needed
   - Regenerate PDF

---

### Method 3: Using Online Markdown to PDF Converters

**Recommended Tools:**
- **Dillinger.io** - Online markdown editor with PDF export
- **Markdown-pdf.com** - Simple converter
- **HackMD** - Collaborative markdown with export options

**Steps:**
1. Combine all parts into one markdown file (copy-paste in order)
2. Upload to online converter
3. Export as PDF
4. Review and download

---

## Customization Checklist

Before finalizing, replace all placeholders with your actual information:

### Personal Information
- [ ] **[Your Name]** → Your actual name
- [ ] **[Your ID]** → Your student ID
- [ ] **[Your Program]** → Your program name (e.g., "Master of Public Health")
- [ ] **[Your Institution]** → University name
- [ ] **[Supervisor Name]** → Your supervisor's actual name
- [ ] **[Co-Supervisor]** → Co-supervisor if applicable

### Contact Information
- [ ] Update email addresses
- [ ] Update phone numbers
- [ ] Update office locations

### Dates
- [ ] Verify all timeline dates are realistic
- [ ] Adjust start date based on actual submission timeline
- [ ] Update "February 2026" on title page to actual month

### Budget
- [ ] Adjust budget amounts based on local rates
- [ ] Update currency if not using USD
- [ ] Add or remove budget items based on actual needs

### Ethics
- [ ] Insert actual ethics committee name
- [ ] Update contact information for ethics office

---

## Quality Checks

### Content Completeness
- [ ] All 7 parts included
- [ ] No missing sections
- [ ] All tables complete
- [ ] All lists complete

### Formatting
- [ ] Consistent heading styles
- [ ] Consistent font and size
- [ ] Proper page breaks
- [ ] Page numbers present
- [ ] Tables formatted properly
- [ ] Bullet points aligned

### Academic Standards
- [ ] All citations in references list match in-text citations
- [ ] References formatted consistently (APA/Harvard/Vancouver)
- [ ] No plagiarism
- [ ] Proper academic tone maintained
- [ ] Grammar and spelling checked

### Page Count
- [ ] Main body is 15-20 pages
- [ ] Appendices are additional (not counted in page limit)

### Signatures
- [ ] Signature lines present on declaration page
- [ ] Leave space for handwritten signatures
- [ ] Dates marked for signature

---

## Suggested Page Distribution

If your final document is outside the 15-20 page range, adjust these sections:

**If Too Long (>20 pages):**
- Condense literature review (keep most relevant studies)
- Reduce table sizes (combine some rows/columns)
- Shorten sample quotes in interview guide
- Use single spacing for reference list
- Remove some detailed sub-sections

**If Too Short (<15 pages):**
- Expand literature review with more studies
- Add more detail to data collection procedures
- Include more examples in methodology
- Expand quality assurance section
- Add more detail to budget justification
- Include conceptual framework diagram

---

## Recommended Section Order for Final Document

1. **Title Page** (1 page)
2. **Table of Contents** (1 page) - Optional
3. **Introduction** (0.5 page)
4. **Background and Problem Statement** (2-3 pages)
5. **Research Questions and Hypotheses** (1 page)
6. **Aims and Objectives** (0.5 page)
7. **Study Design** (1.5 pages)
8. **Study Population and Sampling** (1.5 pages)
9. **Data Collection Methods** (3 pages)
10. **Data Analysis Methods** (3 pages)
11. **Quality Assurance** (2 pages)
12. **Study Timeline** (1 page)
13. **Participants** (0.5 page)
14. **Ethical Considerations** (2 pages)
15. **Resources and Budget** (1.5 pages)
16. **References** (1-2 pages)
17. **Declaration** (0.5 page)

**Total Main Body:** ~18-20 pages

18. **Appendices** (Additional pages, not counted):
    - Appendix A: Survey Instruments (4-5 pages)
    - Appendix B: Interview Guides (3-4 pages)
    - Appendix C: Consent Forms (2-3 pages)
    - Appendix D: TRUST POS Documentation (optional)

---

## Tips for PDF Creation

### For Best Results:
1. **Use consistent formatting** throughout
2. **Check page breaks** - avoid orphaned headings
3. **Verify all links** work (if keeping as clickable PDF)
4. **Test print** one copy before final submission
5. **Create bookmarks** in PDF for easy navigation (optional)

### PDF Settings:
- Quality: High/Press Quality
- Compatibility: PDF/A-1b (for archiving)
- Security: No restrictions
- Metadata: Add title, author, subject

---

## Submission Checklist

- [ ] Combined PDF created
- [ ] Page count verified (15-20 pages main body)
- [ ] All placeholders replaced
- [ ] Proofread entire document
- [ ] References checked
- [ ] Supervisor has reviewed
- [ ] Required signatures obtained
- [ ] File named appropriately: `LastName_ResearchProposal_TRUST_POS_2026.pdf`
- [ ] Backup copy saved to cloud storage
- [ ] Ready for submission!

---

## Alternative: Keep as Separate Files

If your supervisor prefers modular review:

1. Keep each part as a separate PDF
2. Name files clearly:
   - `01_TRUST_Title_Background.pdf`
   - `02_TRUST_Methodology.pdf`
   - `03_TRUST_Data_Collection.pdf`
   - etc.
3. Create a cover page listing all files
4. Submit as a zip folder

---

## Next Steps After Approval

Once your proposal is approved:

1. **Register with Ethics Committee**
2. **Begin participant recruitment**
3. **Finalize TRUST POS system for deployment**
4. **Prepare data collection materials**
5. **Train research team**
6. **Launch pilot study**

---

## Support Resources

If you need help with formatting or assembly:

1. **University Writing Center** - Academic writing support
2. **Library Services** - Reference formatting, citation management
3. **IT Department** - Software installation (Pandoc, etc.)
4. **Supervisor Office Hours** - Content review

---

## Contact for Questions

**Student Researcher:** [Your Email]  
**Supervisor:** [Supervisor Email]  
**Ethics Committee:** [Ethics Email]

---

**Good luck with your research proposal submission!**

This comprehensive proposal demonstrates the rigor and thoroughness expected for academic research while positioning TRUST POS as a meaningful intervention for SME digital transformation in Uganda.

---

**Document Version:** 1.0  
**Last Updated:** February 1, 2026  
**Total Word Count (estimated):** 15,000-18,000 words

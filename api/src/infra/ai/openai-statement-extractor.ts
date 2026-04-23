import OpenAI from 'openai';
import { readFile } from 'fs/promises';
import { IAiStatementExtractor, AiExtractionResult } from '../../contracts/ai-statement-extractor.interface';

export class OpenAIStatementExtractor implements IAiStatementExtractor {

    constructor(private readonly openai: OpenAI) {}

    async analyseAndExtractTransactions(params: {
        imagePaths: string[];
        categoryList: Array<{ id: string; name: string }>;
        monthReference: number;
        yearReference: number;
    }): Promise<AiExtractionResult> {
        const { imagePaths, categoryList, monthReference, yearReference } = params;

        // Convert images to base64 and prepare content for OpenAI
        const imageContents: OpenAI.Chat.ChatCompletionContentPartImage[] = await Promise.all(
            imagePaths.map(async (imagePath) => {
                const buffer = await readFile(imagePath);
                const base64 = buffer.toString('base64');
                const ext = imagePath.split('.').pop()?.toLowerCase() ?? 'jpeg';
                const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
                return {
                    type: 'image_url' as const,
                    image_url: { url: `data:${mime};base64,${base64}` },
                };
            })
        );

        // Send the images and prompt to OpenAI for analysis and extraction
        const response = await this.openai.chat.completions.create({
            model: 'gpt-4.1-mini',
            messages: [
                { role: 'system', content: this.buildPrompt(monthReference, yearReference, categoryList) },
                { role: 'user', content: imageContents },
            ],
            response_format: { type: 'json_object' },
        });

        // Extract token usage and parse the response
        const inputTokens = response.usage?.prompt_tokens ?? null;
        const outputTokens = response.usage?.completion_tokens ?? null;
        const parsed = JSON.parse(response.choices[0]?.message?.content ?? '{}');

        if (parsed.status === 400) {
            return { valid: false, transactions: [], inputTokens, outputTokens, rawResponse: parsed as object };
        }

        return { valid: true, transactions: parsed.data ?? [], inputTokens, outputTokens, rawResponse: parsed as object };
    }

    // Build the prompt for OpenAI based on the provided parameters
    private buildPrompt(
        monthReference: number,
        yearReference: number,
        categoryList: Array<{ id: string; name: string }>,
    ): string {
        return `You are a financial data extraction assistant specialized in credit card statements.

        Step 1 — Validate: confirm the image is a credit card statement or invoice. If not, respond exactly:
        {"status": 400, "message": "The submitted images do not appear to be credit card statements"}

        Step 2 — Scan completely: read the ENTIRE document from top to bottom. Count every line item, charge, or purchase before extracting. Do NOT stop at the first section — statements often have multiple pages or sections (national charges, international charges, installments, etc.).

        Step 3 — Extract ALL transactions without exception. Each transaction must have:
        - expense_category_id: pick the closest match from the available categories
        - merchant: store or service name as written (string or null)
        - transaction_date: YYYY-MM-DD format; the statement reference is ${monthReference}/${yearReference} — use this year for all dates unless the statement explicitly shows a different year
        - parcels: number of installments (integer, default 1)
        - current_parcel: which installment this charge represents (integer, default 1); e.g. for "2/6" → current_parcel = 2
        - parcel_value: value of each installment (decimal); if parcels = 1, parcel_value equals total
        - total: full purchase value — if installment, total = parcel_value × parcels (decimal, required)

        Step 4 — Return the result as valid JSON only, no markdown, no explanation:
        {"status": 200, "data": [...]}

        Rules:
        - Every visible charge must appear in data — omitting items is not allowed.
        - If a field cannot be determined, use null (except total which is always required).
        - Duplicate merchants on the same date are valid separate transactions — keep them.

        Available categories: ${JSON.stringify(categoryList)}`;
    }
}

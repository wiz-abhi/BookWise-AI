import { pipeline } from '@xenova/transformers';

const MODEL_NAME = 'Xenova/all-mpnet-base-v2';
const BATCH_SIZE = 32;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let extractorPipeline: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let modelLoadingPromise: Promise<any> | null = null;

async function getExtractor(): Promise<any> {
    // Return existing pipeline if already loaded
    if (extractorPipeline) {
        return extractorPipeline;
    }

    // If loading is in progress, wait for it
    if (modelLoadingPromise) {
        return modelLoadingPromise;
    }

    // Start loading the model
    modelLoadingPromise = (async () => {
        console.log(`🔄 Loading local embedding model: ${MODEL_NAME}...`);
        const extractor = await pipeline('feature-extraction', MODEL_NAME, {
            quantized: true, // Use quantized model for faster loading/lower memory
        });
        console.log(`✅ Local embedding model loaded: ${MODEL_NAME}`);
        extractorPipeline = extractor;
        return extractor;
    })();

    return modelLoadingPromise;
}

/**
 * Generate embeddings for text using a local transformer model
 * @param texts - Array of text strings to embed
 * @returns Array of embedding vectors (768 dimensions each)
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
        return [];
    }

    const extractor = await getExtractor();
    const embeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
        const batch = texts.slice(i, i + BATCH_SIZE);
        const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(texts.length / BATCH_SIZE);

        console.log(
            `Generating embeddings for batch ${batchNumber}/${totalBatches} (${batch.length} texts)`
        );

        // Process batch - the pipeline can accept an array of strings
        const output = await extractor(batch, {
            pooling: 'mean',
            normalize: true,
        });

        // Extract embeddings from output tensor
        // Output shape: [batch_size, 768]
        const batchEmbeddings: number[][] = [];
        for (let j = 0; j < batch.length; j++) {
            // Get the embedding for the j-th item in the batch
            const embedding = Array.from(output[j].data as Float32Array);
            batchEmbeddings.push(embedding);
        }

        embeddings.push(...batchEmbeddings);
    }

    console.log(`✅ Generated ${embeddings.length} embeddings with local model ${MODEL_NAME}`);
    return embeddings;
}

/**
 * Generate a single embedding
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    const embeddings = await generateEmbeddings([text]);
    return embeddings[0];
}

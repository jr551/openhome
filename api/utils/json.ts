/**
 * Utility to parse JSON fields in Prisma models
 */
export function parseJsonFields(obj: any, fields: string[]): any {
    if (!obj) return obj;

    if (Array.isArray(obj)) {
        return obj.map(item => parseJsonFields(item, fields));
    }

    const result = { ...obj };

    for (const field of fields) {
        if (result[field] !== undefined && typeof result[field] === 'string') {
            try {
                result[field] = JSON.parse(result[field]);
            } catch (_e) {
                // Ignore parsing errors, keep as string
            }
        }
    }

    // Recursively check for nested objects/arrays that might need parsing
    for (const key in result) {
        if (result[key] && typeof result[key] === 'object' && !(result[key] instanceof Date)) {
            result[key] = parseJsonFields(result[key], fields);
        }
    }

    return result;
}

export const JSON_FIELDS = ['jars', 'schedule', 'photos', 'beforePhotos', 'afterPhotos'];

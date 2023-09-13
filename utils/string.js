export function randomString(length) {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz';
    let result = '';
    for (let i=0; i<length; i++) {
        const random = Math.floor(Math.random() * chars.length);
        result += chars.substring(random, random + 1);
    }
    return result;
}
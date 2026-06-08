function handleBigInt(obj) {
    if (obj === null || obj === undefined) {
        return obj;
    }
    
    if (typeof obj === 'bigint') {
        if (obj <= Number.MAX_SAFE_INTEGER && obj >= Number.MIN_SAFE_INTEGER) {
            return Number(obj);
        } else {
            return obj.toString();
        }
    }
    
    if (Array.isArray(obj)) {
        return obj.map(handleBigInt);
    }
    
    if (typeof obj === 'object') {
        if (obj instanceof Date) {
            return obj;
        }
        
        const newObj = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                newObj[key] = handleBigInt(obj[key]);
            }
        }
        return newObj;
    }
    
    return obj;
}

module.exports = { handleBigInt };
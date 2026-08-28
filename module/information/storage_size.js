function sz_GetIndexedDBObjectSize(value, visited)
{
    if (value === null || value === undefined)
        return 0;

    if (!visited)
        visited = new WeakSet();

    const type = typeof value;

    if (type === "string")
        return new Blob([value]).size;

    if (type === "number" || type === "boolean" || type === "bigint")
        return new Blob([String(value)]).size;

    if (type !== "object")
        return 0;

    if (visited.has(value))
        return 0;

    visited.add(value);

    if (value instanceof Blob)
        return value.size;

    if (value instanceof ArrayBuffer)
        return value.byteLength;

    if (ArrayBuffer.isView(value))
        return value.byteLength;

    if (value instanceof Date)
        return 8;

    if (Array.isArray(value))
    {
        let size = 0;

        for (const item of value)
            size += sz_GetIndexedDBObjectSize(item, visited);

        return size;
    }

    let size = 0;

    for (const key of Object.keys(value))
    {
        size += new Blob([key]).size;

        size += sz_GetIndexedDBObjectSize(value[key], visited);
    }

    return size;
}


async function sz_GetIndexedDBSize()
{
    if (!indexedDB.databases)
        return 0;

    let size = 0;

    const databases = await indexedDB.databases();

    for (const databaseInfo of databases)
    {
        if (!databaseInfo.name)
            continue;

        let database;

        try
        {
            database = await new Promise((resolve, reject) =>
            {
                const request = indexedDB.open(databaseInfo.name, databaseInfo.version);

                request.onsuccess = () => resolve(request.result);

                request.onerror = () => reject(request.error);
            });
        }
        catch
        {
            continue;
        }

        const storeNames = Array.from(database.objectStoreNames);

        if (storeNames.length === 0)
        {
            database.close();
            continue;
        }

        try
        {
            const transaction = database.transaction(storeNames, "readonly");

            for (const storeName of storeNames)
            {
                const store = transaction.objectStore(storeName);

                await new Promise((resolve, reject) =>
                {
                    const request = store.openCursor();

                    request.onsuccess = event =>
                    {
                        const cursor = event.target.result;

                        if (!cursor)
                        {
                            resolve();
                            return;
                        }

                        size += sz_GetIndexedDBObjectSize(cursor.value);

                        cursor.continue();
                    };

                    request.onerror = () => reject(request.error);
                });
            }
        }
        catch
        {
        }

        database.close();
    }

    return size;
}


async function sz_GetCacheSize()
{
    if (!window.caches)
        return 0;

    let size = 0;

    const cacheNames = await caches.keys();

    for (const cacheName of cacheNames)
    {
        const cache = await caches.open(cacheName);

        const requests = await cache.keys();

        for (const request of requests)
        {
            const response = await cache.match(request);

            if (!response)
                continue;

            try
            {
                const blob =await response.clone().blob();
                size += blob.size;
            }
            catch
            {
            }
        }
    }

    return size;
}


function sz_GetWebStorageSize(storage)
{
    let size = 0;

    for (let i = 0; i < storage.length; i++)
    {
        const key = storage.key(i);
        const value = storage.getItem(key);

        size += new Blob([key, value]).size;
    }

    return size;
}


function sz_GetCookieSize()
{
    return new Blob([document.cookie]).size;
}


async function sz_GetOriginStorageSize()
{
    if (!navigator.storage?.estimate)
        return 0;

    const estimate = await navigator.storage.estimate();

    return estimate.usage || 0;
}


function sz_ConvertStorageSize(size, unit = "B")
{
    unit = unit.toUpperCase();

    switch (unit)
    {
        case "B": return size;
        case "KB": return size / 1024;
        case "MB": return size / (1024 ** 2);
        case "GB": return size / (1024 ** 3);
        case "TB": return size / (1024 ** 4);
        default: return size;
    }
}


export async function sz_GetStorageSize(type, unit = "B")
{
    let size;

    switch (type)
    {
        case "cache": size = await sz_GetCacheSize(); break;
        case "cookie": size = sz_GetCookieSize(); break;
        // Indexed DB is Approximate Size
        case "indexeddb": size = await sz_GetIndexedDBSize(); break;
        case "localstorage": size = sz_GetWebStorageSize(localStorage); break;
        case "sessionstorage": size = sz_GetWebStorageSize(sessionStorage); break;
        case "origin": size = await sz_GetOriginStorageSize(); break;
        default: return 0;
    }

    return sz_ConvertStorageSize(size, unit);
}
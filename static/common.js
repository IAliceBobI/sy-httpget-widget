// @ts-nocheck

async function _work(work, printWarn, shouldLoop) {
    while (true) {
        try {
            await work()
            break
        } catch (e) {
            if (printWarn) {
                console.log(e)
            }
            if (shouldLoop) {
                await sleep(200)
                continue
            } else {
                break
            }
        }
    }
}

function mainLoop(work) {
    window.onload = function () {
        _work(work, false, true).catch(e => console.error(e))
    }
}

function mainLoopWarn(work) {
    window.onload = function () {
        _work(work, true, true).catch(e => console.error(e))
    }
}

function mainWarn(work) {
    window.onload = function () {
        _work(work, true, false).catch(e => console.error(e))
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getTimeSinceDateString(dateString) {
    const date = new Date(
        dateString.substring(0, 4),  // year
        dateString.substring(4, 6) - 1,  // month (zero-based)
        dateString.substring(6, 8),  // day
        dateString.substring(8, 10),  // hour
        dateString.substring(10, 12),  // minute
        dateString.substring(12, 14)  // second
    );
    const timeDiffMs = Date.now() - date.getTime();
    const timeDiffHours = timeDiffMs / (1000 * 60 * 60);  // convert to hours
    const days = Math.floor(timeDiffHours / 24);
    const hours = Math.floor(timeDiffHours % 24);
    return `${days} days ${hours} hours`;
}

function getWidgetBlockInfo() {
    const widgetBlockEle = window.frameElement.parentElement.parentElement;
    const widgetBlkID = widgetBlockEle.getAttribute('data-node-id');
    return widgetBlkID
}

async function call(url, reqData) {
    const method = "POST"
    const headers = { 'Content-Type': 'application/json' }
    let data = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(reqData),
    })
    data = await data.json()
    if (data?.code && data?.code != 0) {
        console.warn("code=%s %s", data?.code, data?.msg)
        return null
    }
    if (data?.data === undefined)
        return data
    return data.data
}

async function sql(stmt) {
    return call('/api/query/sql', { stmt })
}

async function sqlOne(stmt) {
    const ret = await sql(stmt)
    if (ret.length >= 1) {
        return ret[0]
    }
    return null
}

async function getHPathByID(id) {
    return call('/api/filetree/getHPathByID', { id })
}

async function getLocalStorage() {
    return call('/api/storage/getLocalStorage')
}

async function getBlockKramdown(id) {
    return call('/api/block/getBlockKramdown', { id })
}

async function getBlockAttrs(id) {
    return call('/api/attr/getBlockAttrs', { id })
}

async function insertBlockAfter(data, previousID, dataType = 'markdown') {
    // dataType [markdown, kramdown]
    return call('/api/block/insertBlock', { data, dataType, previousID })
}

async function insertBlockBefore(data, nextID, dataType = 'markdown') {
    // dataType [markdown, kramdown]
    return call('/api/block/insertBlock', { data, dataType, nextID })
}

async function insertBlockAsChildOf(data, parentID, dataType = 'markdown') {
    // dataType [markdown, kramdown]
    return call('/api/block/insertBlock', { data, dataType, parentID })
}

async function checkBlockExist(id) {
    return call("/api/block/checkBlockExist", { id })
}

async function currentTime() {
    return call("/api/system/currentTime", {})
}

async function pushMsg(msg, timeout = 7000) {
    return call("/api/notification/pushMsg", { msg, timeout })
}

async function loadData(namespace, storageName, dv = undefined) {
    const resp = call("/api/file/getFile", { path: `/data/storage/petal/${namespace}/${storageName}` })
    if (!resp) return dv;
    return resp;
}

async function saveData(namespace, storageName, value) {
    const pathString = `/data/storage/petal/${namespace}/${storageName}`;
    let file;
    if (typeof value === "object") {
        file = new File([new Blob([JSON.stringify(value)], {
            type: "application/json"
        })], pathString.split("/").pop());
    } else {
        file = new File([new Blob([value])], pathString.split("/").pop());
    }
    const formData = new FormData();
    formData.append("path", pathString);
    formData.append("file", file);
    formData.append("isDir", "false");

    const method = "POST"
    let resp = await fetch("/api/file/putFile", {
        method,
        body: formData,
    })
    data = await resp.json()
    if (data.code && data.code != 0) {
        console.error("code=%s %s", data.code, data.msg)
        return null
    }
    return data.data
}

async function removeData(namespace, storageName) {
    return call("/api/file/removeFile", { path: `/data/storage/petal/${namespace}/${storageName}` })
}

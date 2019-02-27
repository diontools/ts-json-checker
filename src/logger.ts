export const logOption = {
    isDebug: true
}

export function debug(...messages: any[]) {
    if (logOption.isDebug) {
        console.log(...messages)
    }
}

export function info(...messages: any[]) {
    console.info(...messages)
}
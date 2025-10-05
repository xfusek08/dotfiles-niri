export default function build_timestamp() {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');

    return [
        `${now.getFullYear()}`,
        pad(now.getMonth() + 1),
        pad(now.getDate()),
        pad(now.getHours()),
        pad(now.getMinutes()),
        pad(now.getSeconds()),
    ].join(':');
}

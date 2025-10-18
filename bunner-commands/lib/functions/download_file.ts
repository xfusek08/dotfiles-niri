import { $ } from 'bunner/framework';

export default function download_file({ url, outputPath }: { url: string; outputPath: string }) {
    return $`curl -L ${url} -o ${outputPath}`;
}

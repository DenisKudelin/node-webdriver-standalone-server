import {_, Q, Path, child_process, Url, FS} from "../externals";

export module Helpers {
    export function getJavaVersion() {
        let deffer = Q.defer();
        var spawn = child_process.spawn('java', ['-version']);

        spawn.on('error', (err) => deffer.reject(err));
        spawn.stderr.on('data', data => {
            data = data.toString().split('\n')[0];
            var javaVersion = new RegExp('java version').test(data)
                ? data.split(' ')[2].replace(/"/g, '')
                : false;
            if(javaVersion) {
                deffer.resolve(javaVersion);
            } else {
                deffer.resolve(null);
            }
        });

        return deffer.promise;
    }
}
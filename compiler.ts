import * as fs from 'fs';
import * as ts from 'typescript';
import { register, Options } from 'ts-node/dist/index';

const rollup = require('rollup');

const getOutputFileName = (fileName: string) => {
    return fileName.replace('src', 'build');
};

interface CompilerOptions extends Options {
    strict?: boolean;
    compilerOptions?: ts.CompilerOptions
}

const serviceCache = new Map<CompilerOptions, any>();

let cache: any;

export default (opts: CompilerOptions = {}) => (fileName: string) => {
    return rollup.rollup({
        entry: fileName,
        plugins: [rollupTypescriptPlugin(opts)],
        cache
    }).then((bundle: any) => {
        const result = bundle.generate({ format: 'iife' });
        return result.code;
    });
};

function endsWith ( str: string, tail: string ) {
	return !tail.length || str.slice( -tail.length ) === tail;
}

import {statSync} from 'fs';

const resolveHost: any = {
	directoryExists ( dirPath: string ) {
		try {
			return statSync( dirPath ).isDirectory();
		} catch ( err ) {
			return false;
		}
	},
	fileExists ( filePath: string ) {
		try {
			return statSync( filePath ).isFile();
		} catch ( err ) {
			return false;
		}
	}
};

function rollupTypescriptPlugin(opts: CompilerOptions = {}) {
    return {
        resolveId(importee: string, importer: string) {
            // Handle the special `typescript-helpers` import itself.

            if (!importer) return null;

            let result: any;

            importer = importer.split('\\').join('/');

            result = ts.nodeModuleNameResolver(importee, importer, opts.compilerOptions, resolveHost);

            if (result.resolvedModule && result.resolvedModule.resolvedFileName) {
                if (endsWith(result.resolvedModule.resolvedFileName, '.d.ts')) {
                    return null;
                }

                return result.resolvedModule.resolvedFileName;
            }

            return null;
        },
        transform(code: string, id: string) {
            let service: any;
            if (serviceCache.has(opts)) {
                service = serviceCache.get(opts);
            } else {
                service = register(opts);
                serviceCache.set(opts, service);
            }
            const compiled = service().compile(code, id);
            return { code: compiled };
        }
    }
}
import * as express from 'express';
import * as path from 'path';
import * as ts from 'typescript';
import getTsCompiler from './compiler';

const app = express();

const {compilerOptions} = require('./tsconfig.json');

const compiler = getTsCompiler({
    compilerOptions: Object.assign({}, compilerOptions, {
        target: 'es2015',
        module: 'es6'
    })
});

const staticFolder = 'static';

app.use((req: express.Request, res: express.Response, next: Function) => {

    let onError = (e: Error) => {
        res.status(404);
        next(e);
    };

    if (path.extname(req.url) === '.ts') {
        try {
            compiler(path.join(staticFolder, req.url)).then((compiled: string) => {
                res.writeHead(200, { "Content-Type": "application/javascript" })
                res.end(compiled);
            }).catch(onError);
        } catch (e) {
            onError(e);
        }
    } else {
        next();
    };
});

app.use(express.static(path.join(__dirname, staticFolder)));

const port = process.env.PORT || 3000;
app.set('port', port);

app.listen(app.get('port'), () => console.log('Server listetning on port', app.get('port')));
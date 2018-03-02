const express = require('express');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const rabbit = require('rabbit');

const app = express();
const config = require('config').get('webmthread').get('api');
const defaultModifierFn = data => data;
const wrap = (methodName, modifierFn = defaultModifierFn) => (req, res) =>
    rabbit.dbRequest(methodName, req.body)
        .then((data) => res.status(200).json(modifierFn(data, req.body)).end())
        .catch(e => {
            //Log system errors only.
            if (e instanceof Error) {
                console.error(e);
            }
            const error = e.error || 'serverError';
            return res.status(401).json({ error }).end();
        });

const api = express.Router();
api.use(helmet());
api.use(bodyParser.json());

api.post('/sources', wrap('getSources'));
api.post('/threads', wrap('getThreads'));
api.post('/thread', wrap('getThread'));

rabbit.connect().then(()=>{
    app.use('/api', api);
    app.listen(config.port, () => console.log(`WebmThread API has started on port ${config.port}`));
});

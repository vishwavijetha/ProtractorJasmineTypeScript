const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, prettyPrint } = format;
const path = require('path');
let fs = require('fs-extra');
let today = new Date()
let timeStamp = today.getDate() + '-' + (Number(today.getMonth()) + 1) + '-' + today.getFullYear()
const logPath = path.join(__dirname, '../../reports/' + timeStamp);
fs.mkdirSync(logPath, { recursive: true }, err => { });

class CustomLogger {

    static logger = createLogger(
        {
            levels: {
                emerg: 0,
                alert: 1,
                crit: 2,
                error: 3,
                warning: 4,
                notice: 5,
                info: 6,
                debug: 7
            },
            transports: [
                new transports.File({
                    filename: logPath + '/AutomationLogs.log',
                    options: { flags: 'a' },
                    format: format.combine(
                        format.simple(),
                        format.printf(info => `${new Date(Date.now()).toLocaleString().trim()} ${info.level}: ${info.message}`)
                    )
                }),
                new transports.Console({
                    format: format.combine(
                        format.colorize(),
                        format.simple(),
                        format.printf(info => `${new Date(Date.now()).toLocaleString().trim()} ${info.level}: ${info.message}`)
                    )
                })
            ]
        }
    );
}
module.exports = CustomLogger

import Command from '../../base'
import {flags} from '@oclif/command'
import chalk from 'chalk'
import cli from 'cli-ux'
import * as pd from '../../pd'

export default class RestFetch extends Command {
  static description = 'Fetch objects from PagerDuty'

  static flags = {
    ...Command.flags,
    endpoint: flags.string({
      char: 'e',
      description: 'The path to the endpoint, for example, `/users/PXXXXXX` or `/services`',
      required: true,
    }),
    params: flags.string({
      char: 'p',
      description: 'Parameters to add, for example, `query=martin` or `include[]=teams. Specify multiple times for multiple params.',
      multiple: true,
      default: [],
    }),
  }

  async run() {
    const {flags} = this.parse(RestFetch)

    // get a validated token from base class
    const token = this.token as string

    const params: Record<string, any> = {}

    for (const param of flags.params) {
      const m = param.match(/([^=]+)=(.+)/)
      if (!m || m.length !== 3) {
        this.error(`Invalid parameter '${param}' - params should be formatted as 'key=value'`, {exit: 1})
      }
      let key = m[1].trim()
      const value = m[2].trim()
      if (key.endsWith('[]')) {
        key = key.slice(0, -2)
        if (!(key in params)) {
          params[key] = []
        }
        params[key] = [...params[key], value]
      } else {
        params[key] = value
      }
    }

    cli.action.start('Talking to PD')
    const response = await pd.fetch(token, flags.endpoint, params)

    this.dieIfFailed(response)
    cli.action.stop(chalk.bold.green('done'))
    this.log(JSON.stringify(response.getValue(), null, 2))
  }
}

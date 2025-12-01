import { Injectable, Logger } from '@nestjs/common'
import { spawn } from 'child_process'
import { join } from 'path'

@Injectable()
export class PythonService {
  private readonly logger = new Logger(PythonService.name)
  private readonly scriptsPath = join(process.cwd(), 'scripts', 'python')

  async runScript(scriptName: string, inputData: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const scriptPath = join(this.scriptsPath, scriptName)
      const inputJson = JSON.stringify(inputData)

      this.logger.debug(`Running Python script: ${scriptName}`)

      const pythonProcess = spawn('python3', [scriptPath, inputJson])

      let stdout = ''
      let stderr = ''

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString()
      })

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString()
      })

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          this.logger.error(`Python script ${scriptName} failed with code ${code}`)
          this.logger.error(`stderr: ${stderr}`)
          reject(new Error(`Python script failed: ${stderr}`))
        } else {
          try {
            const result = JSON.parse(stdout)
            resolve(result)
          } catch (error) {
            this.logger.error(`Failed to parse Python script output: ${stdout}`)
            reject(new Error(`Invalid JSON output from Python script: ${error.message}`))
          }
        }
      })

      pythonProcess.on('error', (error) => {
        this.logger.error(`Failed to start Python script: ${error.message}`)
        reject(error)
      })
    })
  }
}

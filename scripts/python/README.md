# Python Scripts

This directory contains standalone Python scripts that can be called from the NestJS backend.

## Setup

Install dependencies:

```bash
cd scripts/python
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Usage from NestJS

```typescript
import { PythonService } from './modules/python/python.service';

// Inject the service
constructor(private pythonService: PythonService) {}

// Call a script
const result = await this.pythonService.runScript('example.py', {
  message: 'Hello',
  count: 3,
});
```

## Script Template

All scripts should:

1. Accept JSON input as first command line argument
2. Output JSON result to stdout
3. Output errors to stderr
4. Exit with code 0 on success, 1 on failure

Example:

```python
#!/usr/bin/env python3
import sys
import json

def main():
    try:
        input_data = json.loads(sys.argv[1])
        result = {"success": True, "data": input_data}
        print(json.dumps(result))
        sys.exit(0)
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}), file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
```

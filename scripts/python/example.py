#!/usr/bin/env python3
"""
Example Python script that can be called from NestJS.
Takes JSON input as first argument and returns JSON output to stdout.
"""

import sys
import json


def process_data(input_data):
    """
    Process the input data and return a result.

    Args:
        input_data: Dictionary with input parameters

    Returns:
        Dictionary with processing results
    """
    # Example processing
    message = input_data.get('message', 'Hello')
    count = input_data.get('count', 1)

    result = {
        'success': True,
        'original_message': message,
        'repeated_message': message * count,
        'processed_count': count,
        'metadata': {
            'script': 'example.py',
            'version': '1.0.0'
        }
    }

    return result


def main():
    try:
        # Read JSON input from command line argument
        if len(sys.argv) < 2:
            raise ValueError('No input data provided')

        input_json = sys.argv[1]
        input_data = json.loads(input_json)

        # Process the data
        result = process_data(input_data)

        # Output result as JSON to stdout
        print(json.dumps(result))
        sys.exit(0)

    except Exception as e:
        # Output error as JSON to stderr
        error_result = {
            'success': False,
            'error': str(e)
        }
        print(json.dumps(error_result), file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()

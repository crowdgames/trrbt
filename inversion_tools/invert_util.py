import json
import subprocess

def script_output(*script_and_args):
    return subprocess.check_output(['python'] + list(script_and_args), text=True)

def script_output_json(*script_and_args):
    return json.loads(script_output(*script_and_args))

def script_output_jsons(*script_and_args):
    return [json.loads(line) for line in script_output(*script_and_args).strip().split('\n')]

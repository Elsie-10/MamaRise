from flask import jsonify


def success_response(data=None, status_code=200):
    return jsonify({"success": True, "data": data, "error": None}), status_code


def error_response(code: str, message: str, status_code=400, details=None):
    error_body = {"code": code, "message": message}
    if details:
        error_body["details"] = details
    return jsonify({"success": False, "data": None, "error": error_body}), status_code
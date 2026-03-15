import sys
import json
import traceback

def main():
    # Expect two args: model_path and message
    try:
        import argparse
        parser = argparse.ArgumentParser()
        parser.add_argument('--model_path', required=True)
        parser.add_argument('--message', required=True)
        args = parser.parse_args()
        model_path = args.model_path
        message = args.message
        try:
            from llama_cpp import Llama
        except Exception as e:
            print(json.dumps({"error": f"import_error", "detail": str(e)}))
            sys.exit(2)

        # minimal config, mirror what routes used
        N_THREADS = 1
        N_CTX = 512
        N_BATCH = 32
        try:
            model = Llama(
                model_path=model_path,
                n_ctx=N_CTX,
                n_batch=N_BATCH,
                n_threads=N_THREADS,
                n_gpu_layers=0,
                use_mmap=False,
                use_mlock=False,
            )
        except Exception as e:
            print(json.dumps({"error": "model_load_error", "detail": str(e)}))
            sys.exit(3)

        try:
            response = model.create_chat_completion(
                messages=[{"role": "user", "content": message}],
                max_tokens=32
            )
            resp_text = None
            try:
                resp_text = response.get('choices', [])[0].get('message', {}).get('content') if isinstance(response, dict) else None
            except Exception:
                resp_text = None

            if not resp_text:
                try:
                    resp_text = str(response)
                except Exception:
                    resp_text = ''

            out = {"response": resp_text, "status": "success"}
            print(json.dumps(out, ensure_ascii=False))
            sys.exit(0)
        except Exception as e:
            # capture traceback for debugging
            tb = traceback.format_exc()
            print(json.dumps({"error": "inference_error", "detail": str(e), "traceback": tb}))
            sys.exit(4)

    except Exception as e:
        print(json.dumps({"error": "unexpected", "detail": str(e)}))
        sys.exit(1)

if __name__ == '__main__':
    main()

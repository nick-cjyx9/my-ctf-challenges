Meow = input("Jailing jailing! Try your best to get my shell: ")

assert len(Meow) < 230

# revenge
# assert len(Meow) < 200

if any(c in Meow for c in "\"' \t\n\r\f\v[]{}0123456789"):
    print("MeowMeow。!")
    exit(1)

MeowMeow = eval


def MeowMeowMeow(MeowMeowMeowMeow):
    global MeowMeow
    # You can never MeowMeow twice!
    myMeow = MeowMeow
    del MeowMeow
    myMeow(MeowMeowMeowMeow)


__builtins__.__dict__.clear()
del __builtins__, __loader__

MeowMeowMeow(Meow)

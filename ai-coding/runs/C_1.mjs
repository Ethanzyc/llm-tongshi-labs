python
def parse_csv_line(line):
    fields = []
    current = []
    i = 0
    n = len(line)
    in_quotes = False
    field_was_quoted = False

    while i < n:
        ch = line[i]

        if in_quotes:
            if ch == '"':
                # 检查是否是转义的双引号 ""
                if i + 1 < n and line[i + 1] == '"':
                    current.append('"')
                    i += 2
                    continue
                else:
                    # 结束引号
                    in_quotes = False
                    i += 1
                    continue
            else:
                current.append(ch)
                i += 1
                continue
        else:
            if ch == '"':
                # 进入引号状态
                in_quotes = True
                field_was_quoted = True
                i += 1
                continue
            elif ch == ',':
                fields.append(''.join(current))
                current = []
                field_was_quoted = False
                i += 1
                continue
            else:
                current.append(ch)
                i += 1
                continue

    fields.append(''.join(current))
    return fields


# 逐条跑验收用例
tests = [
    ("a,b,c", ['a','b','c']),
    ('"a,b",c', ['a,b','c']),
    ('"say ""hi""",x', ['say "hi"','x']),
    ("a,,b", ['a','','b']),
    ("one", ['one']),
    ('"multi,tag",ok,"last"', ['multi,tag','ok','last']),
    (",,", ['','','']),
]

all_pass = True
for idx, (inp, expected) in enumerate(tests, 1):
    got = parse_csv_line(inp)
    ok = got == expected
    all_pass = all_pass and ok
    print(f"#{idx} 输入={inp!r}")
    print(f"   期望={expected}")
    print(f"   实际={got}  -> {'PASS' if ok else 'FAIL'}")

print()
print("全部通过" if all_pass else "存在失败用例")

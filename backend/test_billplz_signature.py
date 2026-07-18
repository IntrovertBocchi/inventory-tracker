import hmac
import hashlib
from functools import cmp_to_key

params = {
    "id": "zq0tm2wc",
    "collection_id": "yhx5t1pp",
    "paid": "true",
    "state": "paid",
    "amount": "100",
    "paid_amount": "100",
    "due_at": "2018-9-27",
    "email": "tester@test.com",
    "mobile": "",
    "name": "TESTER",
    "url": "http://www.billplz-sandbox.com/bills/zq0tm2wc",
    "paid_at": "2018-09-27 15:15:09 +0800",
}

key = "9572e36866d0d3b84e393c9949cbd9c67412bb6b35ce02d130711e5a115cd9f82707fe15dcd6ada19ca17a8f64d6d78763b2972fd1d3a1fbef432f609bf9c406"
expected_signature = "0fe0a20b8d557eeae570377783d062a3816a9ea80f368860bacfa7ec3ca4d00e"


def billplz_key_sort(a, b):
    a_len, b_len = len(a), len(b)
    min_len = min(a_len, b_len)
    a_sub = a[:min_len].lower()
    b_sub = b[:min_len].lower()
    if a_sub < b_sub:
        return -1
    elif a_sub > b_sub:
        return 1
    else:
        return b_len - a_len


sorted_keys = sorted(params.keys(), key=cmp_to_key(billplz_key_sort))
source_string = "|".join(f"{k}{params[k]}" for k in sorted_keys)

computed_signature = hmac.new(
    key.encode(),
    source_string.encode(),
    hashlib.sha256
).hexdigest()

print("SOURCE STRING:", source_string)
print("COMPUTED:     ", computed_signature)
print("EXPECTED:     ", expected_signature)
print("MATCH:", computed_signature == expected_signature)
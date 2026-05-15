import pronouncing

sentence = "game"

words = sentence.split()

for w in words:
    print(w, pronouncing.phones_for_word(w))
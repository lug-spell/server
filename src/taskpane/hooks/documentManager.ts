import {fixAnsiUtf8Issue} from "../../utils";
import InsertLocation = Word.InsertLocation;

interface DocumentManager {
    getWords();
    replaceWord(word: string, replacement: string, removeWord: (wrongWord: string) => void);
    jumpToWord(word: string);
}

export function useDocumentManager(setDebug?): DocumentManager {
    function getDocumentWords() {
        return Word.run(async context => {
            const doc = context.document.body.getHtml();
            await context.sync();
            const docContent = fixAnsiUtf8Issue(doc.value);

            const htmlContent = new DOMParser().parseFromString(docContent, "text/html").body.innerText;
            if (setDebug) setDebug(docContent);
            return unique(removeSpaces(htmlContent.toLowerCase().split(/\s+/)));
        });
    }

    function replaceWord(word: string, replacement: string, removeWord: (wrongWord: string) => void) {
        Word.run(async function (context) {
            const searchResults = context.document.body.search(word, {ignorePunct: true, matchWholeWord: true});
            context.load(searchResults);
            await context.sync();

            if (setDebug) setDebug(JSON.stringify(searchResults.toJSON()));

            searchResults.items.forEach(item => {
                item.insertText(replacement, InsertLocation.replace);
            });

            // Synchronize the document state by executing the queued commands,
            // and return a promise to indicate task completion.
            await context.sync();
            removeWord(word);
        })
    }

    function jumpToWord(word: string) {
        return word;
    }

    return {
        getWords: getDocumentWords,
        replaceWord,
        jumpToWord,
    }
}

function unique(arr: string[]) {
    const u = {};
    return arr.filter((v) => {
        return u[v] = !u.hasOwnProperty(v);
    });
}

function removeSpaces(words: string[]) {
    return words.map(word => word.trim()).filter(word => !!word);
}
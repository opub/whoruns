const simpleGit = require('simple-git');
const fs = require('fs');

// specify the repository directory
const repoDir = '.';

// specify the file path relative to the repository root
const filePath = 'rundead.csv';

// create a new simple-git instance
const git = simpleGit(repoDir);

// get the list of file revisions
git.log({ file: filePath }).then(log => {
    // iterate through the revisions
    log.all.forEach(commit => {

        git.checkout(['--detach', commit.hash]).catch(err => {
            // check if the error is due to a lock file
            if (err.message.includes('.git/index.lock')) {
                // delete the lock file
                fs.unlinkSync(repoDir + '/.git/index.lock');

                // retry the checkout
                git.checkout(['--detach', commit.hash]);
            } else {
                // rethrow the error if it's not due to a lock file
                throw err;
            }
        }).then(() => {
            // read the file contents
            const fileContents = fs.readFileSync(repoDir + '/' + filePath, 'utf8');

            // do something with the file contents
            console.log('Revision:', commit.hash);
            console.log('File contents:', fileContents.substring(0, fileContents.indexOf('\n')));
        });
    });
});

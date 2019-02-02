import MediumEditor from 'medium-editor';
// import MeMarkdown from 'medium-editor-markdown';
import Octokit from '@octokit/rest';
import { gfm } from 'turndown-plugin-gfm';
import TurndownService from 'turndown';
import marked from 'marked';

console.log('gfm', gfm);

const td = new TurndownService().use(gfm);

td.addRule('headings', {
  filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
  replacement: function(innerHTML, node) {
    var hLevel = node.tagName.charAt(1);
    var hPrefix = '';
    for (var i = 0; i < hLevel; i++) {
      hPrefix += '#';
    }
    return '\n' + hPrefix + ' ' + node.innerText + '\n\n';
  }
});

const GitHubMarkdownExtension = MediumEditor.Extension.extend({
  name: 'github-markdown-extension',
  init() {
    this.subscribe('editableInput', () => {
      console.log('editable thing happened');
      console.log(td.turndown(this.base.elements[0]));
    });
  }
});

const github = new Octokit();

const readme = document.getElementById('readme');
const readmeBody = document.querySelector('.markdown-body');

if (readme && !window.location.pathname.endsWith('.md')) {
  const readmeFilename = readme.querySelector('h3')!.innerText.trim();
  const readmeId = document
    .querySelector(`[title="${readmeFilename}"]`)!
    .id.split('-')[1];
  const [, owner, repo] = window.location.pathname.split('/');

  github.git
    .getBlob({ owner, repo, file_sha: readmeId })
    .then((output: any) => atob(output.data.content))
    .then(async (markdown: string) => {
      const { data } = await github.markdown.render({
        text: markdown
      });
      readmeBody!.innerHTML = '';
      // @ts-ignore
      readmeBody.innerHTML = marked(data);
    });

  // const converters = [
  //   {
  //     filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
  //     replacement(innerHTML, node) {
  //       console.log('called?');
  //       var hLevel = node.tagName.charAt(1);
  //       var hPrefix = '';
  //       for (var i = 0; i < hLevel; i++) {
  //         hPrefix += '#';
  //       }
  //       return '\n' + hPrefix + ' ' + node.innerText + '\n\n';
  //     }
  //   }
  // ];

  console.log(readme.querySelector('.markdown-body')!.innerHTML);
  new MediumEditor(readme.querySelector('.markdown-body'), {
    extensions: {
      markdown: new GitHubMarkdownExtension()
    }
  });
  //   extensions: {
  //     markdown: new MeMarkdown(
  //       { toTurndownOptions: { gfm: true, converters } },
  //       (md: string) => console.log(md)
  //     )
  //   }
  // });
}

// if (readme) {
//   new MediumEditor(readme.querySelector('.markdown-body'), {
//     extensions: {
//       markdown: new MeMarkdown((md: string) => console.log(md))
//     }
//   });
// }

console.log('README: ', readme);

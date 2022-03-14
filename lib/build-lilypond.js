'use babel';

import fs from 'fs';
import path from 'path';
import os from 'os';
import { EventEmitter } from 'events';

export const config = {
  customArguments: {
    title: 'Custom arguments',
    description: 'Specify custom arguments for LilyPond.',
    type: 'string',
    default: '-dno-point-and-click -o main',
    order: 0
  },
  eesToolsPath: {
    title: 'EES Tools path',
    description: 'Specify the path of EES Tools.',
    type: 'string',
    default: '',
    order: 1
  },
};

export function provideBuilder() {
  const lpErrorMatch = '(?<file>[\\/0-9a-zA-Z\\._]+):(?<line>\\d+):(?<col>\\d+): error: (?<message>.+)';
  const errorMatch = [ lpErrorMatch ];

  const lpWarningMatch = '(?<file>[\\/0-9a-zA-Z\\._]+):(?<line>\\d+):(?<col>\\d+): warning: (?<message>.+)';
  const warningMatch = [ lpWarningMatch ];

  const customArguments = atom.config.get('build-lilypond.customArguments').trim().split(' ');
  const eesToolsPath = atom.config.get('build-lilypond.eesToolsPath').trim();

  return class LilypondBuildProvider extends EventEmitter {
    constructor(cwd) {
      super();
      this.cwd = cwd;
      atom.config.observe('build-lilypond.customArguments', () => this.emit('refresh'));
    }

    getNiceName() {
      return 'Build LilyPond scores';
    }

    isEligible() {
      const requiredFiles = [ 'Makefile' ]
        .map(f => path.join(this.cwd, f))
        .filter(fs.existsSync);
      return requiredFiles.length > 0;
    }

    settings() {
      var targets = [];

      const scoreFiles = fs.readdirSync(path.join(this.cwd, 'scores'));
      if (scoreFiles.length != 0) {
        var fullscorePos = scoreFiles.indexOf("full_score.ly");
        if (fullscorePos != -1) {
          scoreFiles.splice(fullscorePos, 1);
          scoreFiles.unshift("full_score.ly")
        }
        scoreFiles.map(
          f => targets.push(
            {
              name: `LilyPond: ${f}`,
              exec: 'lilypond',
              args: customArguments.concat(`--include=${eesToolsPath}`).concat(path.join('scores', f)),
              sh: true,
              cwd: this.cwd,
              env: { LANG: 'en_US.UTF-8' },
              errorMatch: errorMatch,
              warningMatch: warningMatch
            }
          )
        )
      }


      return targets;
    }
  };
}

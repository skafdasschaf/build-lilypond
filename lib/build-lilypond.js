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
    default: '-dno-point-and-click',
    order: 0
  },
  mainFile: {
    title: 'Main file',
    description: 'Specify a main file from which your output may be compiled. This will generate a build target for the file.',
    type: 'string',
    default: 'main.ly',
    order: 1
  },
};

export function provideBuilder() {
  const lpErrorMatch = '(?<file>[\\/0-9a-zA-Z\\._]+):(?<line>\\d+):(?<col>\\d+): error: (?<message>.+)';
  const errorMatch = [ lpErrorMatch ];

  const lpWarningMatch = '(?<file>[\\/0-9a-zA-Z\\._]+):(?<line>\\d+):(?<col>\\d+): warning: (?<message>.+)';
  const warningMatch = [ lpWarningMatch ];

  const customArguments = atom.config.get('build-lilypond.customArguments').trim().split(' ');

  return class LilypondBuildProvider extends EventEmitter {
    constructor(cwd) {
      super();
      this.cwd = cwd;
      atom.config.observe('build-lilypond.customArguments', () => this.emit('refresh'));
      atom.config.observe('build-lilypond.mainFile', () => this.emit('refresh'));
    }

    getNiceName() {
      return 'Build LilyPond scores';
    }

    isEligible() {
      const requiredFiles = [ 'main.ly' ]
        .map(f => path.join(this.cwd, f))
        .filter(fs.existsSync);
      return requiredFiles.length > 0;
    }

    settings() {
      var targets = [];

      const mainFile = atom.config.get('build-lilypond.mainFile').trim();
      if (mainFile.length != 0) {
        targets.push(
          {
            name: `LilyAtom: default (${mainFile})`,
            exec: 'lilypond',
            args: customArguments.concat(mainFile),
            sh: true,
            cwd: this.cwd,
            env: { LANG: 'en_US.UTF-8' },
            errorMatch: errorMatch,
            warningMatch: warningMatch
          }
        )
      }


      return targets;
    }
  };
}

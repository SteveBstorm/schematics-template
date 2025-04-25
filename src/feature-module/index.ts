import {
  Rule,
  SchematicContext,
  Tree,
  apply,
  url,
  template,
  move,
  mergeWith,
  SchematicsException,
  renameTemplateFiles
} from '@angular-devkit/schematics';
import { strings } from '@angular-devkit/core'; // Attention: Importer depuis @angular-devkit/core
import { parseName } from '@schematics/angular/utility/parse-name';
import { buildDefaultPath } from '@schematics/angular/utility/workspace';
import { Schema as FeatureModuleSchema } from './schema'; // Assurez-vous que le nom correspond au type exporté depuis schema.d.ts si vous le générez

export function featureModuleFactory(_options: FeatureModuleSchema): Rule {
  return async (tree: Tree, _context: SchematicContext) => {

    // Obtenir le workspace pour trouver le chemin par défaut
    const workspaceConfigBuffer = tree.read('angular.json');
    if (!workspaceConfigBuffer) {
      throw new SchematicsException('Impossible de trouver angular.json');
    }
    const workspaceConfig = JSON.parse(workspaceConfigBuffer.toString());
    const projectName = _options.project || workspaceConfig.defaultProject;
    if (!projectName) {
       throw new SchematicsException('Aucun projet spécifié ou projet par défaut trouvé dans angular.json');
    }
    const project = workspaceConfig.projects[projectName];
     if (!project) {
        throw new SchematicsException(`Le projet '${projectName}' n'existe pas.`);
    }

    // Utiliser buildDefaultPath pour obtenir le chemin de base (souvent 'src/app')
    const defaultPath = await buildDefaultPath(project); // Utilisez 'await' si buildDefaultPath est asynchrone dans votre version
    
    // Analyser le nom et le chemin fournis (ex: 'mon-module' ou 'features/mon-module')
    const parsedPath = parseName(_options.path ?? defaultPath, _options.name); // Utilise defaultPath si _options.path n'est pas défini

    const { name, path } = parsedPath;

    // Vérifier si le nom est fourni
    if (!name) {
        throw new SchematicsException('Option "name" est requise.');
    }

    // Préparer les variations du nom (dasherize, classify, camelize)
    const templateStrings = {
      ...strings, // inclut dasherize, classify, camelize, etc.
      name: name // le nom de base fourni
    };

    // Définir la source des templates (le dossier './files')
    const templateSource = apply(url('./files'), [
      template({
        ...templateStrings, // Passer les variations du nom aux templates
        // Ajoutez d'autres variables si nécessaire ici
      }), renameTemplateFiles(),
      move("src/app/"+path) // Déplacer les fichiers générés vers le bon chemin
    ]);

    // Retourner la règle pour fusionner les templates générés dans l'arbre virtuel
    return mergeWith(templateSource);
  };
}
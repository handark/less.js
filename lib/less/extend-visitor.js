(function (tree) {
    tree.extendFinderVisitor = function() {
        this._visitor = new tree.visitor(this);
        this.contexts = [];
        this.allExtendsStack = [[]];
    };

    tree.extendFinderVisitor.prototype = {
        run: function (root) {
            root = this._visitor.visit(root);
            root.allExtends = this.allExtendsStack[0];
            return root;
        },
        visitRule: function (ruleNode, visitArgs) {
            visitArgs.visitDeeper = false;
            return ruleNode;
        },
        visitMixinDefinition: function (mixinDefinitionNode, visitArgs) {
            visitArgs.visitDeeper = false;
            return mixinDefinitionNode;
        },
        visitRuleset: function (rulesetNode, visitArgs) {

            if (rulesetNode.root) {
                return;
            }

            var i, j, extend, allSelectorsExtendList = [], extendList;

            // get &:extend(.a); rules which apply to all selectors in this ruleset
            for(i = 0; i < rulesetNode.rules.length; i++) {
                if (rulesetNode.rules[i] instanceof tree.Extend) {
                    allSelectorsExtendList.push(rulesetNode.rules[i]);
                }
            }

            // now find every selector and apply the extends that apply to all extends
            // and the ones which apply to an individual extend
            for(i = 0; i < rulesetNode.selectors.length; i++) {
                var selector = rulesetNode.selectors[i];
                extendList = selector.extendList.slice(0).concat(allSelectorsExtendList);
                for(j = 0; j < extendList.length; j++) {
                    extend = extendList[j];
                    extend.findSelfSelectors([[selector]].concat(this.contexts.slice(0)));
                    this.allExtendsStack[this.allExtendsStack.length-1].push(extend);
                }
            }

            this.contexts.push(rulesetNode.selectors);
        },
        visitRulesetOut: function (rulesetNode) {
            if (!rulesetNode.root) {
                this.contexts.length = this.contexts.length - 1;
            }
        },
        visitMedia: function (mediaNode, visitArgs) {
            mediaNode.allExtends = [];
            this.allExtendsStack.push(mediaNode.allExtends);
        },
        visitMediaOut: function (mediaNode) {
            this.allExtendsStack.length = this.allExtendsStack.length - 1;
        },
        visitDirective: function (directiveNode, visitArgs) {
            directiveNode.allExtends = [];
            this.allExtendsStack.push(directiveNode.allExtends);
        },
        visitDirectiveOut: function (directiveNode) {
            this.allExtendsStack.length = this.allExtendsStack.length - 1;
        }
    };

    tree.processExtendsVisitor = function() {
        this._visitor = new tree.visitor(this);
    };

    tree.processExtendsVisitor.prototype = {
        run: function(root) {
            var extendFinder = new tree.extendFinderVisitor();
            extendFinder.run(root);
            this.allExtendsStack = [root.allExtends];
            return this._visitor.visit(root);
        },
        visitRule: function (ruleNode, visitArgs) {
            visitArgs.visitDeeper = false;
            return ruleNode;
        },
        visitMixinDefinition: function (mixinDefinitionNode, visitArgs) {
            visitArgs.visitDeeper = false;
            return mixinDefinitionNode;
        },
        visitRuleset: function (rulesetNode, visitArgs) {
            if (rulesetNode.root) {
                return;
            }
        },
        visitRulesetOut: function (rulesetNode) {
        },
        visitMedia: function (mediaNode, visitArgs) {
            this.allExtendsStack.push(mediaNode.allExtends.concat(this.allExtendsStack[this.allExtendsStack.length-1]));
        },
        visitMediaOut: function (mediaNode) {
            this.allExtendsStack.length = this.allExtendsStack.length - 1;
        },
        visitDirective: function (directiveNode, visitArgs) {
            this.allExtendsStack.push(directiveNode.allExtends.concat(this.allExtendsStack[this.allExtendsStack.length-1]));
        },
        visitDirectiveOut: function (directiveNode) {
            this.allExtendsStack.length = this.allExtendsStack.length - 1;
        }
    };

})(require('./tree'));
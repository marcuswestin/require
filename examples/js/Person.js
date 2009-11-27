// a sample class for demonstration of module('import class Person'). Name of class needs to be the same as the file name
module('from util import log');

function Person(name, age) {
	this.name = name;
	this.age = age;
}

Person.prototype.getName = function() {
	return this.name || 'stranger';
}

Person.prototype.getAge = function() {
	return this.age;
}

Person.prototype.greet = function(person) {
	var greeting = 'Hello ' + person.getName() + '. ';
	greeting += 'My name is ' + this.getName() + ' and I am ' + this.getAge() + ' years old.';
	log(greeting);
}


exports.Person = Person;
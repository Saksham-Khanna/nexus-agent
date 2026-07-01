from langgraph.graph import StateGraph, END

from agent.state import AgentState
from agent.nodes.planner import planner_node
from agent.nodes.researcher import researcher_node
from agent.nodes.scraper import scraper_node
from agent.nodes.summarizer import summarizer_node
from agent.nodes.reflector import reflector_node, should_continue


def build_graph() -> StateGraph:
    graph = StateGraph(AgentState)

    # Register nodes
    graph.add_node("planner", planner_node)
    graph.add_node("researcher", researcher_node)
    graph.add_node("scraper", scraper_node)
    graph.add_node("summarizer", summarizer_node)
    graph.add_node("reflector", reflector_node)

    # Linear edges
    graph.set_entry_point("planner")
    graph.add_edge("planner", "researcher")
    graph.add_edge("researcher", "scraper")
    graph.add_edge("scraper", "summarizer")
    graph.add_edge("summarizer", "reflector")

    # Conditional edge from reflector: loop back or proceed
    graph.add_conditional_edges(
        "reflector",
        should_continue,
        {
            "researcher": "researcher",
            "__end__": END,
        },
    )

    return graph.compile()


# Singleton compiled graph
agent = build_graph()
